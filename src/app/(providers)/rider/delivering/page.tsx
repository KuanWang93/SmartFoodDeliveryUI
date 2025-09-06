"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";

interface RiderOrderVO {
  orderId: number;
  items: string;
  merchantName: string;
  merchantPhone: string;
  merchantAddress: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  eta: string;
  deliveryFee: number;
  status: number;
  pickingUpId: number;
}

export default function RiderDeliveringOrders() {
  const [orders, setOrders] = useState<RiderOrderVO[]>([]);

  // 拉取待取餐（4）+配送中（5）订单
  const fetchOrders = async () => {
    try {
      const res = await apiClient.get<{ data: RiderOrderVO[] }>("/rider/order", {
        params: { status: [4, 5] },
      });
      setOrders(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  const handlePickup = async (orderId: number) => {
    try {
      await apiClient.post(`/rider/order/${orderId}/dispatch`);
      toast.success("已取餐");
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  const handleDeliver = async (orderId: number) => {
    try {
      await apiClient.post(`/rider/order/${orderId}/finish`);
      toast.success("订单已送达");
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">配送中订单</h2>
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">订单号</th>
            <th className="px-4 py-2 border">菜品</th>
            <th className="px-4 py-2 border">餐厅</th>
            <th className="px-4 py-2 border">取餐地址</th>
            <th className="px-4 py-2 border">餐厅电话</th>
            <th className="px-4 py-2 border">收件人</th>
            <th className="px-4 py-2 border">送达地址</th>
            <th className="px-4 py-2 border">配送费</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.orderId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border text-center">{o.orderId}</td>
              <td className="px-4 py-2 border text-center">{o.items}</td>
              <td className="px-4 py-2 border text-center">{o.merchantName}</td>
              <td className="px-4 py-2 border text-center">{o.merchantAddress}</td>
              <td className="px-4 py-2 border text-center">{o.merchantPhone}</td>
              <td className="px-4 py-2 border text-center">{o.recipientName}</td>
              <td className="px-4 py-2 border text-center">{o.deliveryAddress}</td>
              <td className="px-4 py-2 border text-center">${o.deliveryFee}</td>
              <td className="px-4 py-2 border text-center space-x-2">
                {o.status === 4 ? (
                  <button onClick={() => handlePickup(o.orderId)} className="text-orange-600 hover:underline">
                    确认取餐
                  </button>
                ) : (
                  <button onClick={() => handleDeliver(o.orderId)} className="text-green-600 hover:underline">
                    确认送达
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}