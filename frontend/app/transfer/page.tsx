'use client';

import { useState } from 'react';
import { Send, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mockTransactions } from '@/lib/mock-data';

export default function TransferItem() {
  const [formData, setFormData] = useState({
    serialNumber: '',
    newOwnerAddress: '',
    location: '',
    temperature: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [itemInfo, setItemInfo] = useState<any>(null);

  const verifyOwnership = () => {
    if (!formData.serialNumber) return;

    setVerifying(true);
    setError('');

    setTimeout(() => {
      const item = mockTransactions.find(
        tx => tx.serial_number === formData.serialNumber
      );

      if (item) {
        setItemInfo(item);
      } else {
        setError('Item not found with this serial number');
        setItemInfo(null);
      }
      setVerifying(false);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    setTimeout(() => {
      const mockResult = {
        blockchainTxHash: '0x' + Math.random().toString(16).substring(2, 18),
        from: itemInfo.current_owner,
        to: formData.newOwnerAddress,
        status: 'success'
      };

      setResult(mockResult);
      setLoading(false);

      setFormData({
        serialNumber: '',
        newOwnerAddress: '',
        location: '',
        temperature: '',
        notes: ''
      });
      setItemInfo(null);
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transfer Item</h1>
        <p className="text-gray-600 mt-2">Transfer ownership of a pharmaceutical product</p>
      </div>

      {result && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="ml-2">
            <div className="space-y-1">
              <p className="font-semibold text-green-900">Item Transferred Successfully!</p>
              <p className="text-sm text-green-700">Transaction Hash: {result.blockchainTxHash}</p>
              <p className="text-sm text-green-700">From: {result.from.slice(0, 10)}...{result.from.slice(-8)}</p>
              <p className="text-sm text-green-700">To: {result.to.slice(0, 10)}...{result.to.slice(-8)}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="ml-2">
            <p className="font-semibold text-red-900">Transfer Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                placeholder="SN-2024-001"
                required
              />
            </div>
            <Button
              onClick={verifyOwnership}
              disabled={verifying}
              variant="outline"
              className="mt-2"
            >
              {verifying ? 'Verifying...' : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Verify Ownership
                </>
              )}
            </Button>
          </div>

          {itemInfo && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <AlertDescription>
                <h3 className="font-semibold text-blue-900 mb-2">Item Information</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Product ID:</strong> {itemInfo.product_id}</p>
                  <p><strong>Serial Number:</strong> {itemInfo.serial_number}</p>
                  <p><strong>Batch Number:</strong> {itemInfo.batch_number}</p>
                  <p><strong>Current Owner:</strong> {itemInfo.current_owner.slice(0, 10)}...{itemInfo.current_owner.slice(-8)}</p>
                  <p><strong>Status:</strong> <span className="capitalize">{itemInfo.status}</span></p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newOwnerAddress">New Owner Address *</Label>
                <Input
                  id="newOwnerAddress"
                  value={formData.newOwnerAddress}
                  onChange={(e) => setFormData({...formData, newOwnerAddress: e.target.value})}
                  placeholder="0x..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Distribution Center"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                    placeholder="2-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Transfer Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Shipping information, handling notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="submit"
                disabled={loading || !itemInfo}
                className="w-full"
              >
                {loading ? (
                  'Transferring...'
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Transfer Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Only the current owner can transfer an item</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Both parties receive encrypted keys to access transfer data</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Transfer is recorded immutably on blockchain</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>New owner must be registered in the entity database</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
