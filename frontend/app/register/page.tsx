'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { Package, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

// MetaMask type declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}

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

  // 🧠 Ensure MetaMask is connected to Hardhat Localhost
  const ensureCorrectNetwork = async () => {
    if (!window.ethereum) throw new Error("MetaMask not installed");

    const requiredChainId = "0x7A69"; // 31337 in hex (Hardhat default)
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    if (currentChainId !== requiredChainId) {
      try {
        // Try switching to Hardhat
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: requiredChainId }],
        });
        console.log("✅ Switched to Hardhat Localhost");
      } catch (error: any) {
        // If not added, add it
        if (error.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: requiredChainId,
                chainName: "Hardhat Localhost",
                rpcUrls: ["http://127.0.0.1:8545"],
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        } else {
          throw error;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // ✅ Ensure correct network first
      await ensureCorrectNetwork();

      // 1️⃣ Connect to MetaMask
      if (!window.ethereum) throw new Error('MetaMask is not installed');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const ownerAddress = await signer.getAddress();

      // 2️⃣ Contract Setup (your deployed address)
      const contractAddress =
        process.env.NEXT_PUBLIC_SUPPLYCHAIN_ADDRESS ||
        '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default local Hardhat address

      const contractABI = [
        'function registerProduct(bytes32 _serialNumberHash, bytes32 _encryptedProductId, bytes32 _encryptedSerialNumber) external',
      ];

      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // 3️⃣ Prepare Data for Blockchain
      const serialNumber = formData.serialNumber;
      const serialHash = ethers.keccak256(ethers.toUtf8Bytes(serialNumber));
      const encryptedProductId = ethers.encodeBytes32String('Encrypted' + formData.productId);
      const encryptedSerial = ethers.encodeBytes32String('Encrypted' + serialNumber);

      console.log('⏳ Registering product on blockchain...');
      const tx = await contract.registerProduct(serialHash, encryptedProductId, encryptedSerial);
      const receipt = await tx.wait();

      console.log('✅ On-chain registration complete:', receipt.hash);

      // 4️⃣ Sync to backend MySQL
      const payload = {
        productId: formData.productId,
        serialNumber: formData.serialNumber,
        batchNumber: formData.batchNumber,
        ownerAddress,
        transactionData: {
          location: formData.location,
          temperature: formData.temperature,
          notes: formData.notes
        },
        metadata: {},
        blockchainTxHash: receipt.hash,
        blockNumber: receipt.blockNumber
      };

      const res = await fetch('http://localhost:4000/api/transactions/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to register in backend');

      // 5️⃣ Show Result
      setResult({
        blockchainTxHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        keyHash: ethers.keccak256(
          ethers.toUtf8Bytes(`${formData.productId}|${formData.serialNumber}`)
        ),
      });

      setFormData({
        productId: '',
        serialNumber: '',
        batchNumber: '',
        location: '',
        temperature: '',
        notes: ''
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
              <p className="font-semibold text-green-900">✅ Item Registered Successfully!</p>
              <p className="text-sm text-green-700">Tx Hash: {result.blockchainTxHash}</p>
              <p className="text-sm text-green-700">Block: {result.blockNumber}</p>
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
                <Label htmlFor="productId">Product ID *</Label>
                <Input
                  id="productId"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  placeholder="PROD001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="LIPITOR-BATCH-002"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number *</Label>
                <Input
                  id="batchNumber"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="BATCH-002"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Plant A"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional info..."
                rows={3}
              />
            </div>

            <div className="mt-6 flex space-x-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Registering...' : (<><Package className="h-5 w-5 mr-2" /> Register Item</>)}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setFormData({ productId: '', serialNumber: '', batchNumber: '', location: '', temperature: '', notes: '' })
                }
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
// Notes: