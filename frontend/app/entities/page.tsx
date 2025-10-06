'use client';

import { Users, CircleCheck as CheckCircle, Building2, Building, Hospital, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockEntities } from '@/lib/mock-data';

export default function Entities() {
  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'manufacturer':
        return FlaskConical;
      case 'distributor':
        return Building2;
      case 'pharmacy':
        return Building;
      case 'hospital':
        return Hospital;
      default:
        return Users;
    }
  };

  const getEntityColor = (type: string) => {
    switch (type) {
      case 'manufacturer':
        return 'bg-violet-100 text-violet-600';
      case 'distributor':
        return 'bg-blue-100 text-blue-600';
      case 'pharmacy':
        return 'bg-green-100 text-green-600';
      case 'hospital':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Entities</h1>
        <p className="text-gray-600 mt-2">Supply chain participants and their verification status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { type: 'manufacturer', label: 'Manufacturers', count: 1 },
          { type: 'distributor', label: 'Distributors', count: 1 },
          { type: 'pharmacy', label: 'Pharmacies', count: 0 },
          { type: 'hospital', label: 'Hospitals', count: 0 },
        ].map((stat) => {
          const Icon = getEntityIcon(stat.type);
          return (
            <Card key={stat.type}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold mt-2">{stat.count}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${getEntityColor(stat.type)}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockEntities.map((entity) => {
          const Icon = getEntityIcon(entity.entity_type);
          return (
            <Card key={entity.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-lg ${getEntityColor(entity.entity_type)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{entity.name}</h3>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {entity.entity_type}
                      </Badge>
                    </div>
                  </div>
                  {entity.verified && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-1" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-mono text-xs">
                      {entity.address.slice(0, 10)}...{entity.address.slice(-8)}
                    </span>
                  </div>
                  {entity.license_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">License:</span>
                      <span className="font-medium">{entity.license_number}</span>
                    </div>
                  )}
                  {entity.metadata?.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{entity.metadata.location}</span>
                    </div>
                  )}
                  {entity.metadata?.established && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Established:</span>
                      <span className="font-medium">{entity.metadata.established}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entity Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>All entities must be verified before participating in the supply chain</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Verification includes license validation and regulatory compliance checks</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Only verified entities can register or receive pharmaceutical products</span>
            </p>
            <p className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Entity information is stored on-chain for transparency</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
