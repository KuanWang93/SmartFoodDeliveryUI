"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/services/apiClient";
import toast from "react-hot-toast";

interface Statistics {
  totalIncome: number;
  deliveredOrders: number;
  avgIncome: number;
  weekRanking: number;
  monthIncome: number;
  monthOrders: number;
}

export default function RiderStatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: Statistics }>("/rider/dashboard/overview");
      setStats(res.data.data);
    } catch (e: any) {
      toast.error(e.response?.data?.msg ?? e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="bg-white rounded shadow p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">收入统计</h2>
      {loading || !stats ? (
        <div>加载中...</div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <StatCard title="累计收入" value={`$${stats.totalIncome}`} />
          <StatCard title="已完成订单" value={stats.deliveredOrders} />
          <StatCard title="平均每单" value={`$${stats.avgIncome}`} />
          <StatCard title="本月收入" value={`$${stats.monthIncome}`} />
          <StatCard title="本月完成订单" value={stats.monthOrders} />
          <StatCard title="本周排名" value={stats.weekRanking} />
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-yellow-50 shadow rounded p-6 text-center">
      <p className="text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
