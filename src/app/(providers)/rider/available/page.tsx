"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";

interface RiderOrderVO {
  orderId: number;
  items: string;
  merchantName: string;
  merchantAddress: string;
  deliveryAddress: string;
  deliveryFee: number;
  remark?: string;
  attemptedAt: string;
}

export default function RiderAvailableOrders() {
  const [orders, setOrders] = useState<RiderOrderVO[]>([]);
  const [rejectTimers, setRejectTimers] = useState<Record<number, number>>({});

  // 拉取待抢单（status=3）
  const fetchOrders = async () => {
    try {
      const res = await apiClient.get<{ data: RiderOrderVO[] }>("/rider/order", {
        params: { status: 3 },
      });
      setOrders(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  // 抢单/拒单
  const handleAccept = async (orderId: number) => {
    try {
      await apiClient.post(`/rider/order/${orderId}/accept`);
      toast.success("接单成功");
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };
  const handleReject = async (orderId: number, rejectType: 1 | 2 = 1) => {
    try {
      await apiClient.post("/rider/order/reject", { orderId, rejectType });
      toast.success(rejectType === 1 ? "已拒绝订单" : "超时未响应，已自动拒绝");
      fetchOrders();
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  // 倒计时逻辑（每单独立计时）
  useEffect(() => {
    if (!orders.length) return;
    const timers: Record<number, number> = {};
    orders.forEach(order => {
      const attempted = new Date(order.attemptedAt).getTime();
      const now = Date.now();
      const remain = Math.max(120 - Math.floor((now - attempted) / 1000), 0);
      timers[order.orderId] = remain;
    });
    setRejectTimers(timers);

    const interval = setInterval(() => {
      setRejectTimers(prev => {
        const updated: Record<number, number> = {};
        orders.forEach(order => {
          const attempted = new Date(order.attemptedAt).getTime();
          const now = Date.now();
          const remain = Math.max(120 - Math.floor((now - attempted) / 1000), 0);
          updated[order.orderId] = remain;
          if (remain === 0 && prev[order.orderId] > 0) {
            handleReject(order.orderId, 2);
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">可抢单</h2>
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">订单号</th>
            <th className="px-4 py-2 border">剩余时间</th>
            <th className="px-4 py-2 border">商家</th>
            <th className="px-4 py-2 border">取餐地址</th>
            <th className="px-4 py-2 border">送达地址</th>
            <th className="px-4 py-2 border">配送费</th>
            <th className="px-4 py-2 border">备注</th>
            <th className="px-4 py-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.orderId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border text-sm text-center">{o.orderId}</td>
              <td className="px-4 py-2 border text-red-500 text-center">
                {rejectTimers[o.orderId] ?? 120}s
              </td>
              <td className="px-4 py-2 border text-center">{o.merchantName}</td>
              <td className="px-4 py-2 border text-center">{o.merchantAddress}</td>
              <td className="px-4 py-2 border text-center">{o.deliveryAddress}</td>
              <td className="px-4 py-2 border text-center">${o.deliveryFee}</td>
              <td className="px-4 py-2 border text-center">{o.remark || "—"}</td>
              <td className="px-4 py-2 border text-center space-x-2">
                <button onClick={() => handleAccept(o.orderId)} className="text-green-600 hover:underline">抢单</button>
                <button onClick={() => handleReject(o.orderId, 1)} className="text-red-600 hover:underline">拒单</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}