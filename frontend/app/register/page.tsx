'use client';

import { useState } from 'react';
import { Package, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RegisterItem() {
  const [formData, setFormData] = useState({
    productId: '',
    serialNumber: '',
    batchNumber: '',
    location: '',
    temperature: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    setTimeout(() => {
      const mockResult = {
        blockchainTxHash: '0x' + Math.random().toString(16).substring(2, 18),
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        keyHash: '0x' + Math.random().toString(16).substring(2, 18),
        status: 'success'
      };

      setResult(mockResult);
      setLoading(false);

      setFormData({
        productId: '',
        serialNumber: '',
        batchNumber: '',
        location: '',
        temperature: '',
        notes: ''
      });
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Register New Item</h1>
        <p className="text-gray-600 mt-2">Add a new pharmaceutical product to the supply chain</p>
      </div>

      {result && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <AlertDescription className="ml-2">
            <div className="space-y-1">
              <p className="font-semibold text-green-900">Item Registered Successfully!</p>
              <p className="text-sm text-green-700">Transaction Hash: {result.blockchainTxHash}</p>
              <p className="text-sm text-green-700">Block Number: {result.blockNumber}</p>
              <p className="text-sm text-green-700">Key Hash: {result.keyHash}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="ml-2">
            <p className="font-semibold text-red-900">Registration Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product ID (GTIN) *</Label>
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  placeholder="00300001234567"
                  required
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                  placeholder="BATCH-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Manufacturing Plant A"
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
                  placeholder="-70"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional information..."
                rows={3}
              />
            </div>

            <div className="mt-6 flex space-x-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  'Registering...'
                ) : (
                  <>
                    <Package className="h-5 w-5 mr-2" />
                    Register Item
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  productId: '',
                  serialNumber: '',
                  batchNumber: '',
                  location: '',
                  temperature: '',
                  notes: ''
                })}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Only manufacturers can register new items on the blockchain</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>All data is encrypted with AES-256-GCM before storage</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Transaction uses Polygon PoS consensus algorithm</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Confirmation time: ~20 seconds</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
