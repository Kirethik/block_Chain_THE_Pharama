'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Package, Users, Activity, Settings, Chrome as Home, Send, Search } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Register Item', href: '/register', icon: Package },
    { name: 'Transfer Item', href: '/transfer', icon: Send },
    { name: 'Track Item', href: '/track', icon: Search },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Entities', href: '/entities', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-bold text-blue-600">PharmaChain</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 bg-white border-r">
          <div className="flex items-center h-16 px-4 border-b">
            <Activity className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-blue-600">PharmaChain</h1>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <div className="text-xs text-gray-500">
              <p className="font-semibold mb-1">Network: Polygon PoS</p>
              <p>Confirmations: 10 blocks</p>
              <p>Block Time: ~2s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b items-center px-4 lg:px-8">
          <button
            className="lg:hidden mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Demo Mode</span>
          </div>
        </div>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
