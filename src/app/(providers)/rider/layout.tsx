"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home, ClipboardList, Truck, History, BarChart2, User, ChevronLeft, ChevronRight, LogOut, MapPlusIcon } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction, selectUsername, selectNeedsProfileCompletion, selectAuth } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { setLastMessage, setIsConnected } from '@/store/slices/riderWebSocketSlice';
import { setLocation, clearLocation } from "@/store/slices/locationSlice";

const navItems = [
  { label: '工作台', href: '/rider/dashboard', icon: Home },
  { label: '地图', href: '/rider/map', icon: MapPlusIcon },
  { label: '待抢订单', href: '/rider/available', icon: ClipboardList },
  { label: '配送中订单', href: '/rider/delivering', icon: Truck },
  { label: '历史订单', href: '/rider/history', icon: History },
  { label: '收入统计', href: '/rider/statistics', icon: BarChart2 },
  { label: '个人资料', href: '/rider/profile', icon: User },
];

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [riderStatus, setRiderStatus] = useState<number | null>(null); // 0: 未激活, 1: 可接单
  const [statusLoading, setStatusLoading] = useState(true);
  const auth = useSelector(selectAuth);
  const username = useSelector(selectUsername);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const menuRef = useRef<HTMLDivElement>(null);
  const needsProfileCompletion = useSelector(selectNeedsProfileCompletion);
  const accessToken = auth.accessToken;
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket连接
  useEffect(() => {
    if (!accessToken) return;
    if (wsRef.current) return;
    const ws = new WebSocket(`ws://localhost:8080/ws/rider?accessToken=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => dispatch(setIsConnected(true));
    ws.onmessage = evt => {
      try {
        const msg = JSON.parse(evt.data);
        dispatch(setLastMessage(msg));
      } catch {
        dispatch(setLastMessage(evt.data));
      }
    };
    ws.onclose = () => {
      wsRef.current = null;
      dispatch(setIsConnected(false));
    };
    return () => {
      ws.close();
      wsRef.current = null;
      dispatch(setIsConnected(false));
    };
  }, [accessToken, dispatch]);

  // 路由守卫：未完善资料先跳转profile
  useEffect(() => {
    if (
      needsProfileCompletion === true &&
      !pathname.startsWith("/rider/profile")
    ) {
      toast.error("请先完善骑手资料");
      router.replace("/rider/profile");
    }
  }, [needsProfileCompletion, pathname, router]);

  // 当前页面名
  const currentNav = navItems.find(item => pathname.startsWith(item.href));
  const pageName = currentNav ? currentNav.label : '';

  // 请求骑手当前状态
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await apiClient.get('/rider/status'); // 建议返回 { data: 1 } 代表可接单
        setRiderStatus(res.data.data);
      } catch (e) {
        setRiderStatus(0);
      } finally {
        setStatusLoading(false);
      }
    }
    fetchStatus();
  }, []);

  // 切换骑手状态
  const toggleRiderStatus = async () => {
    if (riderStatus === null) return;
    setStatusLoading(true);
    try {
      const newStatus = riderStatus === 1 ? 0 : 1;
      const res = await apiClient.post(`/rider/status/${newStatus}`); // 0:未激活, 1:激活
      setRiderStatus(newStatus);
      toast.success(res.data.msg || (newStatus === 1 ? '已开启接单' : '已暂停接单'));
    } catch (err: any) {
      toast.error(err.message);
    }
    setStatusLoading(false);
  };

  // 如果是可接单状态，自动上报当前定位
  useEffect(() => {
    let watchId: number | null = null;
    function handlePosition(pos: GeolocationPosition) {
      const { latitude, longitude } = pos.coords;
      dispatch(setLocation({ lat: latitude, lng: longitude })); // 先写redux
      apiClient.post('/rider/location', { latitude, longitude }); // 不用await，直接“发请求”
    }
    if (riderStatus === 1 && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        handlePosition,
        err => toast.error('定位失败，请检查浏览器权限'),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    } else {
      dispatch(clearLocation());
    }
    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [riderStatus, dispatch]);  

  // 点击外部关闭菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 登出
  const handleLogout = async () => {
    if (riderStatus === 1) {
      try {
        await apiClient.post('/rider/status/0');
      } catch (e: any) {
        console.warn('关闭骑手接单失败', e);
        // 可选：show toast 提示用户
      }
    }
    dispatch(logoutAction());
    dispatch(clearLocation());
    wsRef.current?.close();
    dispatch(setIsConnected(false));
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen">
      <aside className={`bg-gray-800 text-white transition-all duration-200 ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Image src="/images/sf_logo.png" alt="SmartFoodDelivery Logo" width={32} height={32} />
            {!collapsed && <span className="ml-2 text-xl font-bold">SmartFoodDelivery</span>}
          </div>
          <button onClick={() => setCollapsed(!collapsed)} className="focus:outline-none">
            {collapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
          </button>
        </div>
        <nav className="mt-6">
          {navItems.map(({ label, href, icon: Icon }) => {
              const disabled =
                needsProfileCompletion === true && href !== "/rider/profile";
              return (
                <Link
                  key={href}
                  href={disabled ? "#" : href}
                  onClick={(e) => {
                    if (disabled) {
                      e.preventDefault();
                      toast("请先完善骑手资料");
                    }
                  }}
                  className={`flex items-center px-4 py-3 hover:bg-gray-700 
                    ${pathname.startsWith(href) ? "bg-gray-700" : ""}
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="ml-3">{label}</span>}
                </Link>
              );
            })
          }
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="flex justify-between items-center bg-white py-6 px-8 shadow pr-20">
          <h2 className="text-2xl font-bold">{pageName}</h2>
          <div className="flex items-center space-x-6">
            {/* 状态栏和切换按钮 */}
            <div>
              {statusLoading ? (
                <span className="text-gray-500">状态加载中…</span>
              ) : (
                <>
                  <span>
                    接单状态:{" "}
                    <span className={riderStatus === 1 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {riderStatus === 1 ? '可接单' : '未激活'}
                    </span>
                  </span>
                  <button
                    onClick={toggleRiderStatus}
                    disabled={statusLoading}
                    className={`
                      px-3 py-1 ml-4 rounded
                      ${riderStatus === 1 ? 'bg-gray-300 text-gray-600 hover:bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}
                      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
                    `}
                  >
                    {riderStatus === 1 ? '暂停接单' : '开始接单'}
                  </button>
                </>
              )}
            </div>
            {/* 用户名下拉 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(open => !open)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                {auth.image ? (
                  <img
                    src={`/api/images?key=${encodeURIComponent(auth.image)}`}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <User size={20} />
                )}
                <span className="truncate max-w-xs">{username}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-10 min-w-max">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center space-x-2 px-4 py-2 hover:bg-gray-100"
                  >
                    <LogOut size={16} />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}