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
  completedAt: string;
}

export default function RiderOrderHistory() {
  const [orders, setOrders] = useState<RiderOrderVO[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await apiClient.get<{ data: RiderOrderVO[] }>("/rider/order", {
        params: { status: 6 },
      });
      setOrders(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">历史订单</h2>
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">订单号</th>
            <th className="px-4 py-2 border">菜品</th>
            <th className="px-4 py-2 border">餐厅</th>
            <th className="px-4 py-2 border">取餐地址</th>
            <th className="px-4 py-2 border">送达地址</th>
            <th className="px-4 py-2 border">配送费</th>
            <th className="px-4 py-2 border">完成时间</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.orderId} className="hover:bg-gray-50">
              <td className="px-4 py-2 border text-center">{o.orderId}</td>
              <td className="px-4 py-2 border text-center">{o.items}</td>
              <td className="px-4 py-2 border text-center">{o.merchantName}</td>
              <td className="px-4 py-2 border text-center">{o.merchantAddress}</td>
              <td className="px-4 py-2 border text-center">{o.deliveryAddress}</td>
              <td className="px-4 py-2 border text-center">${o.deliveryFee}</td>
              <td className="px-4 py-2 border text-center">{o.completedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
