'use client';

import { useState } from 'react';
import { Search, MapPin, Clock, User, CircleAlert as AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockTransactions } from '@/lib/mock-data';
import { format } from 'date-fns';

export default function TrackItem() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    setLoading(true);
    setError('');
    setTransactions([]);

    setTimeout(() => {
      const results = mockTransactions.filter(
        tx => tx.serial_number === searchQuery || tx.key_hash === searchQuery
      );

      if (results.length > 0) {
        setTransactions(results);
      } else {
        setError('No transactions found for this identifier');
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Track Item</h1>
        <p className="text-gray-600 mt-2">Search for item by serial number or key hash</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter serial number or key hash..."
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Search className="h-5 w-5 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="ml-2">
            <p className="text-red-700">{error}</p>
          </AlertDescription>
        </Alert>
      )}

      {transactions.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Product ID</p>
                  <p className="font-semibold">{transactions[0].product_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Serial Number</p>
                  <p className="font-semibold font-mono">{transactions[0].serial_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Batch Number</p>
                  <p className="font-semibold">{transactions[0].batch_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Owner</p>
                  <p className="font-semibold text-sm font-mono">
                    {transactions[0].current_owner.slice(0, 10)}...{transactions[0].current_owner.slice(-8)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    transactions[0].status === 'finalized' ? 'bg-green-100 text-green-800' :
                    transactions[0].status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transactions[0].status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Transfers</p>
                  <p className="font-semibold">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {transactions.map((tx, index) => (
                  <div key={tx.id} className="border-l-4 border-blue-600 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold capitalize text-lg">{tx.transaction_type}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.status === 'finalized' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {tx.status}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          {tx.previous_owner && (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>From: <span className="font-mono">{tx.previous_owner.slice(0, 10)}...{tx.previous_owner.slice(-8)}</span></span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>To: <span className="font-mono">{tx.current_owner.slice(0, 10)}...{tx.current_owner.slice(-8)}</span></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(tx.createdAt), 'PPpp')}</span>
                          </div>
                          {tx.transaction_data?.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{tx.transaction_data.location}</span>
                            </div>
                          )}
                          {tx.onchain_tx_hash && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>Block: {tx.block_number}</span>
                              <a
                                href={`https://polygonscan.com/tx/${tx.onchain_tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center"
                              >
                                View on Explorer
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          )}
                          {tx.transaction_data?.temperature && (
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Temperature:</span>
                              <span>{tx.transaction_data.temperature}°C</span>
                            </div>
                          )}
                          {tx.transaction_data?.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <span className="font-medium">Notes: </span>
                              <span>{tx.transaction_data.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-sm text-gray-500">
                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center font-semibold">
                          {transactions.length - index}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
