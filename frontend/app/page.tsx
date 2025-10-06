'use client';

import { Package, Activity, TrendingUp, CircleCheck as CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTransactions, mockProducts } from '@/lib/mock-data';
import { format } from 'date-fns';

export default function Home() {
  const totalItems = mockTransactions.length;
  const activeTransfers = mockTransactions.filter(t => t.status === 'pending').length;
  const completedTransfers = mockTransactions.filter(t => t.status === 'finalized').length;
  const totalProducts = mockProducts.length;

  const statCards = [
    {
      title: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Active Transfers',
      value: activeTransfers,
      icon: Activity,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Completed',
      value: completedTransfers,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100'
    },
    {
      title: 'Products',
      value: totalProducts,
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-100'
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of pharmaceutical supply chain activities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Serial Number</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{tx.product_id}</td>
                    <td className="py-3 px-4 text-sm font-mono">{tx.serial_number}</td>
                    <td className="py-3 px-4 text-sm capitalize">{tx.transaction_type}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.status === 'finalized' ? 'bg-green-100 text-green-800' :
                        tx.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(tx.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Network Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Network:</span>
                <span className="font-semibold">Polygon PoS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Consensus:</span>
                <span className="font-semibold">Proof of Stake + Checkpointing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Confirmations:</span>
                <span className="font-semibold">10 blocks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Block Time:</span>
                <span className="font-semibold">~2 seconds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Finality Time:</span>
                <span className="font-semibold">~20 seconds</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>AES-256-GCM encryption for sensitive data</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Immutable blockchain audit trail</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Digital signatures for authentication</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Role-based access control</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Cold chain monitoring and alerts</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
