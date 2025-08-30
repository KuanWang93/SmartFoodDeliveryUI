"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";

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
  remark?: string;
  status: number;
  attemptedAt: string;
  pickedUpAt?: string;
  completedAt?: string;
  pickingUpId: number;
}

// Tab配置
const tabStatusMap = {
  available: [3],     // 3=待抢单
  pickingUp: [4],     // 4=待取餐
  dispatching: [5],   // 5=配送中
  delivered: [6],     // 6=已完成
} as const;

type TabType = keyof typeof tabStatusMap;

export default function RiderDashboard() {
  const router = useRouter();
  const [filter, setFilter] = useState<TabType>("available");
  const [orders, setOrders] = useState<RiderOrderVO[]>([]);
  const [rejectTimers, setRejectTimers] = useState<Record<number, number>>({});
  const [kpi, setKpi] = useState({ totalIncome: 0, completedOrders: 0, avgIncome: 0 });
  const [stats, setStats] = useState({ availableCount: 0, pickingUpCount: 0, dispatchingCount: 0 });
  const lastMessage = useAppSelector(state => state.riderWebSocket.lastMessage);
  const processedMsgIds = useRef(new Set());

  // 新订单推送
  useEffect(() => {
    if (!lastMessage) return;
    if ('type' in lastMessage && lastMessage.type === "ORDER_READY") {
      const uniqueKey = lastMessage.orderId || lastMessage.timestamp || JSON.stringify(lastMessage);
      if (processedMsgIds.current.has(uniqueKey)) return;
      processedMsgIds.current.add(uniqueKey);

      toast.success("有新的可抢订单！");
      fetchDashboardData();
      fetchOrders(tabStatusMap[filter]);
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("You have a new acceptable order!"));
    }
    // eslint-disable-next-line
  }, [lastMessage]);

  // 日期
  const [today, setToday] = useState("");
  useEffect(() => {
    const d = new Date();
    setToday(`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`);
  }, []);

  // KPI与统计
  const fetchDashboardData = async () => {
    try {
      const res = await apiClient.get<{
        data: {
          totalIncome: number;
          completedOrders: number;
          avgIncome: number;
          availableCount: number;
          pickingUpCount: number;
          dispatchingCount: number;
        }
      }>("/rider/dashboard/overview");
      const d = res.data.data;
      setKpi({
        totalIncome: d.totalIncome,
        completedOrders: d.completedOrders,
        avgIncome: d.avgIncome,
      });
      setStats({
        availableCount: d.availableCount,
        pickingUpCount: d.pickingUpCount,
        dispatchingCount: d.dispatchingCount,
      });
    } catch (e: any) {
      toast.error("加载骑手数据失败：" + (e.response?.data?.msg ?? e.message));
    }
  };

  // 切换Tab
  const handleFilter = (type: TabType) => {
    setFilter(type);
    sessionStorage.setItem("riderDashboardCurrentTab", type);
    fetchOrders(tabStatusMap[type]);
  };

  // 查询订单
  const fetchOrders = async (statusCodes: readonly number[]) => {
    try {
      const res = await apiClient.get<{ data: RiderOrderVO[] }>('/rider/order', {
        params: { status: statusCodes } // axios会自动转换成 status=3&status=4
      });
      setOrders(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  // 接单/拒单/已取餐/已送达/查看详情 按钮
  const handleAccept = async (orderId: number) => {
    try {
      const res = await apiClient.post(`/rider/order/${orderId}/accept`);
      toast.success(res.data.msg || "接单成功");
      fetchDashboardData();
      handleFilter("available");
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  const handleReject = async (orderId: number, rejectType: 1 | 2 = 1) => {
    try {
      await apiClient.post("/rider/order/reject", { orderId, rejectType });
      toast.success(rejectType === 1 ? "已拒绝订单" : "超时未响应，已自动拒绝");
      fetchDashboardData();
      handleFilter("available");
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };
  
  const handlePickup = async (orderId: number) => {
    try {
      const res = await apiClient.post(`/rider/order/${orderId}/dispatch`);
      toast.success(res.data.msg || "已取餐");
      fetchDashboardData();
      handleFilter("pickingUp");
      handleFilter("dispatching");
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  const handleDeliver = async (orderId: number) => {
    try {
      const res = await apiClient.post(`/rider/order/${orderId}/finish`);
      toast.success(res.data.msg || "订单已送达");
      fetchDashboardData();
      handleFilter("delivered");
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
  };

  const handleView = (orderId: number) => {
    router.push(`/rider/order/${orderId}`);
  };

  // 倒计时和自动拒单
  useEffect(() => {
    if (filter !== "available" || orders.length === 0) return;

    // 初始化倒计时
    const timers: Record<number, number> = {};
    orders.forEach(order => {
      const attempted = new Date(order.attemptedAt).getTime();
      const now = Date.now();
      const remain = Math.max(120 - Math.floor((now - attempted) / 1000), 0);
      timers[order.orderId] = remain;
    });
    setRejectTimers(timers);

    // 每秒刷新
    const interval = setInterval(() => {
      setRejectTimers(prev => {
        const updated: Record<number, number> = {};
        orders.forEach(order => {
          const attempted = new Date(order.attemptedAt).getTime();
          const now = Date.now();
          const remain = Math.max(120 - Math.floor((now - attempted) / 1000), 0);
          updated[order.orderId] = remain;

          // 自动拒单
          if (remain === 0 && prev[order.orderId] > 0) {
            handleReject(order.orderId, 2); // 2=超时自动拒单
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [orders, filter]);


  // 初始化
  useEffect(() => {
    fetchDashboardData();
    const saved = sessionStorage.getItem("riderDashboardCurrentTab");
    const allTabs: TabType[] = Object.keys(tabStatusMap) as TabType[];
    const initialTab: TabType = (saved && allTabs.includes(saved as TabType))
      ? (saved as TabType)
      : "available";
    setFilter(initialTab);
    fetchOrders(tabStatusMap[initialTab]);
    // eslint-disable-next-line
  }, []);

  return (
    <>
      {/* 日期 */}
      <div className="mb-2 px-2">
        <h3 className="text-lg font-semibold">今日数据 {today}</h3>
      </div>

      {/* KPI 容器 */}
      <div className="bg-white shadow rounded mb-2">
        <div className="flex justify-between items-center px-6 py-2">
          <h3 className="text-lg font-semibold">KPI 总览</h3>
          <Link href="/rider/statistics" className="text-blue-600 hover:underline">
            详细数据 &gt;
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4 px-6 py-2 bg-white">
          <KpiCard title="累计收入" value={`$ ${kpi.totalIncome}`} />
          <KpiCard title="已完成订单" value={kpi.completedOrders} />
          <KpiCard title="平均单价" value={`$ ${kpi.avgIncome}`} />
        </div>
      </div>

      {/* 订单统计概览 */}
      <div className="bg-white shadow rounded p-6 mb-2 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">订单管理</h3>
          <Link href="/rider/history" className="text-blue-600 hover:underline">
            历史订单 &gt;
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <OrderStatusCard label="可抢单" count={stats.availableCount} />
          <OrderStatusCard label="待取餐" count={stats.pickingUpCount} />
          <OrderStatusCard label="配送中" count={stats.dispatchingCount} />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">当前任务</h3>
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => handleFilter("available")}
              className={`px-4 py-2 rounded ${
                filter === "available" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              可抢单 ({stats.availableCount})
            </button>
            <button
              onClick={() => handleFilter("pickingUp")}
              className={`px-4 py-2 rounded ${
                filter === "pickingUp" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              取餐中 ({stats.pickingUpCount})
            </button>
            <button
              onClick={() => handleFilter("dispatching")}
              className={`px-4 py-2 rounded ${
                filter === "dispatching" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              配送中 ({stats.dispatchingCount})
            </button>
            <button
              onClick={() => handleFilter("delivered")}
              className={`px-4 py-2 rounded ${
                filter === "delivered" ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              已完成 ({kpi.completedOrders})
            </button>
          </div>
        </div>
        {/* 各Tab的表格 */}
        {filter === "available" ? (
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">订单号</th>
                <th className="px-4 py-2 border">剩余时间</th>
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
                  <td className="px-4 py-2 border text-sm text-center text-red-500">
                    {rejectTimers[o.orderId] ?? 120}s
                  </td>
                  <td className="px-4 py-2 border text-sm text-center">{o.merchantAddress}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.deliveryAddress}</td>
                  <td className="px-4 py-2 border text-sm text-center">${o.deliveryFee}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.remark || "—"}</td>
                  <td className="px-4 py-2 border text-sm text-center space-x-2">
                    <button
                      onClick={() => handleAccept(o.orderId)}
                      className="text-green-600 hover:underline"
                    >
                      抢单
                    </button>
                    <button
                      onClick={() => handleReject(o.orderId, 1)}
                      className="text-red-600 hover:underline"
                    >
                      拒单
                    </button>
                    <button
                      onClick={() => handleView(o.orderId)}
                      className="text-blue-600 hover:underline"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filter === "pickingUp" ? (
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">订单号</th>
                <th className="px-4 py-2 border">菜品</th>
                <th className="px-4 py-2 border">餐厅名称</th>
                <th className="px-4 py-2 border">取餐地址</th>
                <th className="px-4 py-2 border">餐厅电话</th>
                <th className="px-4 py-2 border">取餐号</th>
                <th className="px-4 py-2 border">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.orderId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-sm text-center">{o.orderId}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.items}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.merchantName}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.merchantAddress}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.merchantPhone}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.pickingUpId}</td>
                  <td className="px-4 py-2 border text-sm text-center">
                    <button
                      onClick={() => handlePickup(o.orderId)}
                      className="text-orange-600 hover:underline"
                    >
                      确认取餐
                    </button>
                    <button
                      onClick={() => handleView(o.orderId)}
                      className="text-blue-600 hover:underline"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filter === "dispatching" ? (
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">订单号</th>
                <th className="px-4 py-2 border">菜品</th>
                <th className="px-4 py-2 border">收件人姓名</th>
                <th className="px-4 py-2 border">收件人电话</th>
                <th className="px-4 py-2 border">收件人地址</th>
                <th className="px-4 py-2 border">预计到达时间</th>
                <th className="px-4 py-2 border">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.orderId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-sm text-center">{o.orderId}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.items}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.recipientName}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.recipientPhone}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.deliveryAddress}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.eta}</td>
                  <td className="px-4 py-2 border text-sm text-center">
                    <button
                      onClick={() => handleDeliver(o.orderId)}
                      className="text-green-600 hover:underline"
                    >
                      确认送达
                    </button>
                    <button
                      onClick={() => handleView(o.orderId)}
                      className="text-blue-600 hover:underline"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // 已完成
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">订单号</th>
                <th className="px-4 py-2 border">取餐地址</th>
                <th className="px-4 py-2 border">送达地址</th>
                <th className="px-4 py-2 border">接单时间</th>
                <th className="px-4 py-2 border">送达时间</th>
                <th className="px-4 py-2 border">配送费</th>
                <th className="px-4 py-2 border">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.orderId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-sm text-center">{o.orderId}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.merchantAddress}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.deliveryAddress}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.attemptedAt}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.completedAt}</td>
                  <td className="px-4 py-2 border text-sm text-center">{o.deliveryFee}</td>
                  <td className="px-4 py-2 border text-sm text-center">
                    <button
                      onClick={() => handleView(o.orderId)}
                      className="text-blue-600 hover:underline"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

// KPI 卡片
function KpiCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-yellow-50 shadow rounded p-6 text-center">
      <p className="text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// 订单状态统计卡片
function OrderStatusCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="bg-yellow-50 shadow rounded p-6 text-center">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-semibold">{count}</p>
    </div>
  );
}