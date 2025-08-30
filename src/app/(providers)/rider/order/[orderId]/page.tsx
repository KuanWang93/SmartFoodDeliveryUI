"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";

interface OrderItemVO {
  dishName: string;
  quantity: number;
}

interface StatusLogVO {
  fromStatus: number;
  toStatus: number;
  changedBy: string;
  remark?: string;
  changedAt: string;
}

interface AddressBookVO {
  recipient: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
}

interface RiderOrderDetailVO {
  orderId: number;
  merchantName: string;
  merchantPhone: string;
  merchantAddress: string;
  address: AddressBookVO;
  items: OrderItemVO[];
  totalAmount: number;
  deliveryFee: number;
  remark?: string;
  status: number;
  statusLogs: StatusLogVO[];
  estimateDeliveryTime: string;
}

const statusText = (status: number) => {
  switch (status) {
    case 0: return "待支付";
    case 1: return "已支付";
    case 2: return "已接单";
    case 3: return "已就绪";
    case 4: return "待取餐";
    case 5: return "配送中";
    case 6: return "已完成";
    case 7: return "已取消";
    default: return `未知（${status}）`;
  }
};

export default function RiderOrderDetailPage() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();
  const [detail, setDetail] = useState<RiderOrderDetailVO | null>(null);

  const fetchDetail = async () => {
    try {
      const res = await apiClient.get<{ data: RiderOrderDetailVO }>(`/rider/order/${orderId}`);
      setDetail(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  useEffect(() => {
    if (orderId) fetchDetail();
  }, [orderId]);

  if (!detail) {
    return <div className="p-6">加载中...</div>;
  }

  const address = detail.address;
  const fullAddress = [address.addressLine1, address.addressLine2, address.city, address.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-6">
      <button className="mb-4 text-blue-600 hover:underline" onClick={() => router.back()}>&lt; 返回</button>

      <h2 className="text-2xl font-bold mb-2">订单详情 #{detail.orderId}</h2>
      <div className="mb-2 text-sm text-gray-600">
        订单状态：<span className="font-semibold">{statusText(detail.status)}</span>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-1">餐厅信息</h3>
        <div>名称：{detail.merchantName}</div>
        <div>电话：{detail.merchantPhone}</div>
        <div>地址：{detail.merchantAddress}</div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-1">收件信息</h3>
        <div>收件人：{address.recipient}（{address.phone}）</div>
        <div>送达地址：{fullAddress}</div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-1">菜品列表</h3>
        <ul className="list-disc pl-5">
          {detail.items.map((item, idx) => (
            <li key={idx}>{item.dishName} x{item.quantity}</li>
          ))}
        </ul>
      </div>

      <div className="mb-2">配送费：<b>${detail.deliveryFee}</b></div>
      <div className="mb-2">总金额：<b>${detail.totalAmount}</b></div>
      <div className="mb-2">备注：{detail.remark || "—"}</div>
      <div className="mb-4">预计送达：{detail.estimateDeliveryTime}</div>

      {/* 状态流 */}
      <div className="mb-4">
        <h3 className="font-semibold mb-1">订单状态流</h3>
        <ul className="border rounded bg-gray-50 px-4 py-2">
          {detail.statusLogs && detail.statusLogs.length > 0 ? detail.statusLogs.map((log, i) => (
            <li key={i} className="mb-1 text-sm">
              <span className="font-medium">{statusText(log.fromStatus)} → {statusText(log.toStatus)}</span>
              &nbsp;[{log.changedAt}]
              {log.remark && <span className="text-gray-500">（{log.remark}）</span>}
            </li>
          )) : <li>暂无状态流</li>}
        </ul>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mt-4">
        {detail.status === 4 && (
          <button
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
            onClick={async () => {
              await apiClient.post(`/rider/order/${orderId}/dispatch`);
              toast.success("已取餐");
              fetchDetail();
            }}
          >
            确认取餐
          </button>
        )}
        {detail.status === 5 && (
          <button
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            onClick={async () => {
              await apiClient.post(`/rider/order/${orderId}/finish`);
              toast.success("订单已送达");
              fetchDetail();
            }}
          >
            确认送达
          </button>
        )}
      </div>
    </div>
  );
}
