'use client';

import { Package, Plus, Thermometer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockProducts } from '@/lib/mock-data';

export default function Products() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-2">Registered pharmaceutical products in the supply chain</p>
        </div>
        <Button>
          <Plus className="h-5 w-5 mr-2" />
          Register Product
        </Button>
      </div>

      {mockProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">Start by registering your first product</p>
              <Button>Register Product</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                  {product.active ? (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-2">{product.product_name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product ID:</span>
                    <span className="font-mono text-xs">{product.product_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manufacturer:</span>
                    <span className="font-medium">{product.manufacturer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </div>
                  {product.requires_cold_chain && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center text-blue-600">
                        <Thermometer className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">Requires Cold Chain</span>
                      </div>
                    </div>
                  )}
                  {product.metadata?.storage && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-medium">{product.metadata.storage}</span>
                    </div>
                  )}
                </div>

                <Button variant="outline" className="w-full mt-4">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Vaccines', count: 1, color: 'bg-blue-100 text-blue-800' },
              { name: 'Diabetes', count: 1, color: 'bg-green-100 text-green-800' },
              { name: 'Antibiotics', count: 1, color: 'bg-yellow-100 text-yellow-800' },
              { name: 'General', count: 0, color: 'bg-gray-100 text-gray-800' },
            ].map((category) => (
              <div key={category.name} className="text-center p-4 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold">{category.count}</p>
                <p className="text-sm text-gray-600">{category.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
