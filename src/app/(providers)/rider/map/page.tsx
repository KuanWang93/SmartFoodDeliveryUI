"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

// 顶层使用字符串常量，不直接引用 window.google
const TRAVEL_MODES = [
  { label: "驾车", value: "DRIVING" },
  { label: "骑行", value: "BICYCLING" },
  { label: "步行", value: "WALKING" },
] as const;
type TravelModeValue = typeof TRAVEL_MODES[number]["value"];

interface OrderPoint {
  orderId: number;
  merchantName: string;
  merchantLng: number;
  merchantLat: number;
  destinationName: string;
  destinationLng: number;
  destinationLat: number;
}

export default function RiderMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
  const [loading, setLoading] = useState(true);
  const riderLocation = useSelector((state: RootState) => state.location);
  const [orderPoints, setOrderPoints] = useState<OrderPoint[]>([]);
  const [travelMode, setTravelMode] = useState<TravelModeValue>("DRIVING");
  const [eta, setEta] = useState<string | null>(null);

  // 拉取订单点
  useEffect(() => {
    apiClient
      .get<{ data: OrderPoint[] }>("/rider/order/points")
      .then((res) => setOrderPoints(res.data.data))
      .catch(() => toast.error("获取订单失败"));
  }, []);

  // 初始化地图
  useEffect(() => {
    if (map) return;
    if (!riderLocation?.lat || !riderLocation?.lng) return;

    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader.load().then(() => {
      const gmap = new window.google.maps.Map(mapRef.current!, {
        center: { lat: riderLocation.lat ?? 0, lng: riderLocation.lng ?? 0 },
        zoom: 14,
      });
      const renderer = new window.google.maps.DirectionsRenderer({
        map: gmap,
        suppressMarkers: false,
      });

      setMap(gmap);
      setDirectionsRenderer(renderer);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riderLocation, map]);

  // 进行路径规划／重算
  useEffect(() => {
    if (
      !map ||
      !directionsRenderer ||
      !riderLocation?.lat ||
      !riderLocation?.lng ||
      orderPoints.length === 0
    ) {
      return;
    }

    // 构建所有的途经点：商家 + 用户地址
    const waypoints: google.maps.DirectionsWaypoint[] = [];
    orderPoints.forEach((order) => {
      waypoints.push({
        location: { lat: order.merchantLat, lng: order.merchantLng },
        stopover: true,
      });
      waypoints.push({
        location: { lat: order.destinationLat, lng: order.destinationLng },
        stopover: true,
      });
    });

    const origin = { lat: riderLocation.lat, lng: riderLocation.lng };
    const destination =
      waypoints.length > 0
        ? (waypoints[waypoints.length - 1].location as google.maps.LatLngLiteral)
        : origin;

    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin,
        destination,
        waypoints: waypoints.slice(0, waypoints.length - 1),
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode[travelMode as keyof typeof google.maps.TravelMode],
      },
      (result, status) => {
        if (status === "OK" && result) {
          directionsRenderer.setDirections(result);
          // 计算预计时长
          const totalSec = result.routes[0].legs.reduce(
            (sum, leg) => sum + (leg.duration?.value || 0),
            0
          );
          setEta(totalSec > 0 ? `${Math.round(totalSec / 60)} 分钟` : null);
        } else {
          toast.error(`路径规划失败：${status}`);
          setEta(null);
        }
      }
    );

    // 保持中心在当前位置
    map.panTo(origin);
  }, [map, directionsRenderer, riderLocation, orderPoints, travelMode]);

  return (
    <div className="w-full h-[85vh] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="text-xl font-bold">配送路线导航</h2>
        <div className="flex space-x-2">
          {TRAVEL_MODES.map((m) => (
            <button
              key={m.value}
              className={
                "px-4 py-1 rounded font-medium border " +
                (travelMode === m.value
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100")
              }
              onClick={() => setTravelMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {eta && (
        <div className="px-4 py-2 text-blue-700 font-medium text-lg">
          预估送达：{eta}
        </div>
      )}

      {loading && <div className="p-4">地图加载中...</div>}

      <div ref={mapRef} className="flex-1 rounded shadow" />
    </div>
  );
}