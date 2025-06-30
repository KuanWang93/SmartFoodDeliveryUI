"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";

interface OrderItemVO {
  dishName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  remark?: string;
}

interface AddressBookVO {
  recipient: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
}

interface OrderStatusLogVO {
  fromStatus: number;
  toStatus: number;
  changedBy: string;
  remark?: string;
  changedAt: string;
}

interface OrderDetailVO {
  orderId: number;
  clientPhone: string;
  items: OrderItemVO[];
  address: AddressBookVO;
  totalAmount: number;
  deliveryFee: number;
  paymentMethod: string;
  paidAt: string;
  status: number;
  remark?: string;
  statusLogs: OrderStatusLogVO[];
}

// 状态码映射，请根据实际业务枚举进行调整
const statusMap: Record<number, string> = {
  0: "待支付",
  1: "已支付",
  2: "准备中",
  3: "已就绪",
  4: "待取餐",
  5: "配送中",
  6: "已完成",
  7: "已取消"
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetailVO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await apiClient.get<{ data: OrderDetailVO }>(
          `/merchant/orders/${orderId}`
        );
        setOrder(res.data.data);
      } catch (e: any) {
        toast.error(e.response?.data?.msg ?? e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [orderId]);

  if (loading) {
    return <div className="p-6 text-center">加载中...</div>;
  }
  if (!order) {
    return (
      <div className="p-6 text-center text-red-500">
        无法获取订单详情
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow rounded space-y-6">
      <button
        className="text-blue-600 hover:underline"
        onClick={() => router.back()}
      >
        ← 返回
      </button>

      <h2 className="text-2xl font-semibold">
        订单详情 #{order.orderId}
      </h2>

      {/* 客户信息 & 地址 */}
      <div className="space-y-1">
        <p>
          <strong>客户电话：</strong>
          {order.clientPhone}
        </p>
        <p>
          <strong>收货人：</strong>
          {order.address.recipient} ({order.address.phone})
        </p>
        <p>
          <strong>地址：</strong>
          {order.address.addressLine1}
          {order.address.addressLine2
            ? `, ${order.address.addressLine2}`
            : ""}
          , {order.address.city}, {order.address.state}
        </p>
      </div>

      {/* 菜品清单 */}
      <table className="min-w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">菜品</th>
            <th className="px-4 py-2 border">数量</th>
            <th className="px-4 py-2 border">单价</th>
            <th className="px-4 py-2 border">小计</th>
            <th className="px-4 py-2 border">备注</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{item.dishName}</td>
              <td className="px-4 py-2 border">{item.quantity}</td>
              <td className="px-4 py-2 border">$ {item.unitPrice}</td>
              <td className="px-4 py-2 border">$ {item.subtotal}</td>
              <td className="px-4 py-2 border">
                {item.remark || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 订单摘要 */}
      <div className="space-y-1">
        <p>
          <strong>合计金额：</strong>$ {order.totalAmount}
        </p>
        <p>
          <strong>配送费：</strong>$ {order.deliveryFee}
        </p>
        <p>
          <strong>支付方式：</strong> {order.paymentMethod}
        </p>
        <p>
          <strong>支付时间：</strong>{" "}
          {new Date(order.paidAt).toLocaleString()}
        </p>
        <p>
          <strong>订单状态：</strong> {order.status}
        </p>
        <p>
          <strong>客户备注：</strong> {order.remark || "—"}
        </p>
      </div>

      {/* 状态变更日志 */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">状态变更记录</h3>
        {order.statusLogs.length === 0 ? (
          <p className="text-gray-500">暂无记录</p>
        ) : (
          <ul className="space-y-2">
            {order.statusLogs.map((log, idx) => (
              <li
                key={idx}
                className="border p-4 rounded bg-gray-50"
              >
                <p className="text-sm text-gray-600">
                  {new Date(log.changedAt).toLocaleString()} —{" "}
                  {log.changedBy}
                </p>
                <p className="mt-1">
                  <strong>
                    {statusMap[log.fromStatus] ?? log.fromStatus} → {statusMap[log.toStatus] ?? log.toStatus}
                  </strong>
                </p>
                <p className="mt-1 text-gray-700">
                  备注：{log.remark || "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
