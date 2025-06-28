// app/merchant/statistics/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
});

type RevenuePoint = { date: string; value: number };
type UserPoint    = { date: string; all: number; newClients: number };
type OrderPoint   = { date: string; total: number; valid: number };
type DishPoint    = { name: string; sales: number };

const PERIODS = [
  { label: "7天",    value: 7   },
  { label: "15天",   value: 15  },
  { label: "1个月",  value: 30  },
  { label: "3个月",  value: 90  },
  { label: "半年",   value: 180 },
  { label: "1年",    value: 365 },
] as const;

export default function MerchantStatisticsPage() {
  // 1. 周期 state
  const [period, setPeriod] = useState<number>(7);

  // 4 个图表的数据 state
  const [revenueTrend, setRevenueTrend] = useState<RevenuePoint[]>([]);
  const [userTrend,    setUserTrend]    = useState<UserPoint[]>([]);
  const [orderTrend,   setOrderTrend]   = useState<OrderPoint[]>([]);
  const [topDishes,    setTopDishes]    = useState<DishPoint[]>([]);

  // 2. 根据 period 并行拉取
  useEffect(() => {
    const qs = `?period=${period}`;

    apiClient
      .get<{ data: RevenuePoint[] }>(`/merchant/statistics/revenueTrend${qs}`)
      .then((res) => setRevenueTrend(res.data.data))
      .catch(() => toast.error("拉取营业额趋势失败"));

    apiClient
      .get<{ data: UserPoint[] }>(`/merchant/statistics/userTrend${qs}`)
      .then((res) => setUserTrend(res.data.data))
      .catch(() => toast.error("拉取用户统计失败"));

    apiClient
      .get<{ data: OrderPoint[] }>(`/merchant/statistics/orderTrend${qs}`)
      .then((res) => setOrderTrend(res.data.data))
      .catch(() => toast.error("拉取订单统计失败"));

    apiClient
      .get<{ data: DishPoint[] }>(`/merchant/statistics/topDishes${qs}`)
      .then((res) => setTopDishes(res.data.data))
      .catch(() => toast.error("拉取菜品销量 Top10 失败"));
  }, [period]);

  return (
    <div className="p-4 space-y-6">
      {/* 3. 周期标签栏 */}
      <div className="inline-flex bg-gray-200 rounded-full p-1 space-x-1 mb-4">
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`px-3 py-1 text-sm rounded-full transition-colors ${
              period === value
                ? "bg-white text-blue-600 font-semibold shadow"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="营业额趋势">
          <ReactECharts
            option={getRevenueOption(revenueTrend)}
            style={{ height: 300 }}
          />
        </ChartCard>

        <ChartCard title="用户统计">
          <ReactECharts
            option={getUserTrendOption(userTrend)}
            style={{ height: 300 }}
          />
        </ChartCard>

        <ChartCard title="订单统计">
          <ReactECharts
            option={getOrderTrendOption(orderTrend)}
            style={{ height: 300 }}
          />
        </ChartCard>

        <ChartCard title="菜品销量排名 Top10">
          <ReactECharts
            option={getTop10Option(topDishes)}
            style={{ height: 300 }}
          />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function getRevenueOption(data: RevenuePoint[]) {
  return {
    tooltip: { trigger: "axis", formatter: (p: any[]) => `${p[0].axisValue}<br/>¥${p[0].data}` },
    xAxis: { type: "category", data: data.map((d) => d.date) },
    yAxis: { type: "value", name: "营业额 ($)" },
    series: [{ name: "营业额", type: "line", data: data.map((d) => d.value), smooth: true }],
  };
}

function getUserTrendOption(data: UserPoint[]) {
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["总用户", "新用户"] },
    xAxis: { type: "category", data: data.map((d) => d.date) },
    yAxis: { type: "value" },
    series: [
      { name: "总用户", type: "line", data: data.map((d) => d.all), smooth: true },
      { name: "新用户", type: "line", data: data.map((d) => d.newClients), smooth: true },
    ],
  };
}

function getOrderTrendOption(data: OrderPoint[]) {
  return {
    tooltip: { trigger: "axis" },
    legend: { data: ["订单数", "有效订单数"] },
    xAxis: { type: "category", data: data.map((d) => d.date) },
    yAxis: { type: "value" },
    series: [
      { name: "订单数", type: "line", data: data.map((d) => d.total), smooth: true },
      { name: "有效订单数", type: "line", data: data.map((d) => d.valid), smooth: true },
    ],
  };
}

function getTop10Option(data: DishPoint[]) {
  return {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((d) => d.name),
      axisLabel: { interval: 0, rotate: 30 },
    },
    yAxis: { type: "value", name: "销量" },
    series: [{ name: "销量", type: "bar", barWidth: "60%", data: data.map((d) => d.sales) }],
  };
}
