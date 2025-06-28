"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Home, Tag, Utensils, ClipboardList, User, ChevronLeft, ChevronRight, BarChart2, LogOut  } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction, selectUsername } from '../../../store/slices/authSlice';
import toast from 'react-hot-toast';

const navItems = [
  { label: 'Dashboard', href: '/merchant/dashboard', icon: Home },
  { label: 'Category Management', href: '/merchant/category', icon: Tag },
  { label: 'Dish Management', href: '/merchant/dish', icon: Utensils },
  { label: 'Order Management', href: '/merchant/order', icon: ClipboardList },
  { label: 'Statistics', href: '/merchant/statistics', icon: BarChart2 },
  { label: 'Profile', href: '/merchant/profile', icon: User },
];

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [storeOpen, setStoreOpen] = useState<boolean | null>(null);
  const username = useSelector(selectUsername);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const menuRef = useRef<HTMLDivElement>(null);

  // Get current page name
  const currentNav = navItems.find(item => pathname.startsWith(item.href));
  const pageName = currentNav ? currentNav.label : '';

  // 进入非订单详情页面时删除状态，从订单详情页面返回时保留状态
  const prevPathRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPathRef.current;
    const cur = pathname;

    // 匹配 /merchant/order/[orderId]
    const isDetail = /^\/merchant\/order\/[^\/]+$/.test(cur);
    const wasDetail = prev !== null && /^\/merchant\/order\/[^\/]+$/.test(prev);

    // 只有「既不是从详情页来」也「不是进入详情页」时，才清掉 tab
    if (!wasDetail && !isDetail) {
      sessionStorage.removeItem("currentOrderTab");
    }
    prevPathRef.current = cur;
  }, [pathname]);

  // Fetch initial store status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get('/merchant/status')
        setStoreOpen(res.data.data === 1)
      } catch (e) {
        console.error('Fetch store status failed', e)
      }
    }
    fetchStatus()
  }, [])

  const toggleStoreStatus = async () => {
    try {
      const newStatus = storeOpen ? 0 : 1
      const res = await apiClient.post(`/merchant/status/${newStatus}`)
      toast.success(res.data.msg)
      setStoreOpen(newStatus === 1)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

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
    // 无状态jwt，无需请求后端删除token
    /* try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API failed', e);
    } */
    dispatch(logoutAction());
    router.push('/auth/login');
  };

  return (
    <div className="flex h-screen">
      <aside className={`bg-gray-800 text-white transition-all duration-200 ${collapsed ? 'w-20' : 'w-72'}`}>
        {/* Logo, Title and Toggle */}
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
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-4 py-3 hover:bg-gray-700 ${pathname.startsWith(href) ? 'bg-gray-700' : ''}`}
            >
              <Icon size={20} />
              {!collapsed && <span className="ml-3">{label}</span>}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="flex justify-between items-center bg-white py-6 px-8 shadow pr-20">
          <h2 className="text-2xl font-bold">{pageName}</h2>
          <div className="flex items-center space-x-4">
            {storeOpen !== null && (
              <>
                <span>
                  Merchant Status: <span className={`${storeOpen ? 'text-green-600' : 'text-red-600'} font-semibold`}>{storeOpen ? '营业中' : '未营业'}</span>
                </span>
                <button onClick={toggleStoreStatus} className="px-3 py-1 bg-blue-600 text-white rounded">
                  {storeOpen ? '关闭营业' : '开启营业'}
                </button>
              </>
            )}
            {/* 用户名下拉 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(open => !open)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <User size={20} />
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