export const mockProducts = [
  {
    id: '1',
    product_id: '00300001234567',
    product_name: 'COVID-19 mRNA Vaccine',
    manufacturer: 'BioPharm Inc.',
    description: 'mRNA-based vaccine for COVID-19 prevention',
    category: 'vaccine',
    requires_cold_chain: true,
    active: true,
    metadata: {
      dosage: '0.3ml',
      storage: '-70°C',
    }
  },
  {
    id: '2',
    product_id: '00300001234568',
    product_name: 'Insulin Glargine 100U/ml',
    manufacturer: 'DiabetesCare Ltd.',
    description: 'Long-acting insulin for diabetes management',
    category: 'diabetes',
    requires_cold_chain: true,
    active: true,
    metadata: {
      dosage: '100 units/ml',
      storage: '2-8°C',
    }
  },
  {
    id: '3',
    product_id: '00300001234569',
    product_name: 'Amoxicillin 500mg',
    manufacturer: 'GlobalMeds Corp.',
    description: 'Broad-spectrum antibiotic',
    category: 'antibiotic',
    requires_cold_chain: false,
    active: true,
    metadata: {
      dosage: '500mg tablets',
      storage: 'Room temperature',
    }
  },
];

export const mockTransactions = [
  {
    id: '1',
    transaction_type: 'register',
    product_id: '00300001234567',
    serial_number: 'SN-2024-001',
    batch_number: 'BATCH-2024-001',
    key_hash: '0x1234567890abcdef',
    previous_owner: null,
    current_owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onchain_tx_hash: '0xabcdef1234567890',
    block_number: 1000001,
    status: 'finalized',
    transaction_data: {
      location: 'Manufacturing Plant A',
      temperature: '-70',
      notes: 'Initial production batch'
    },
    metadata: {},
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: '2',
    transaction_type: 'transfer',
    product_id: '00300001234567',
    serial_number: 'SN-2024-001',
    batch_number: 'BATCH-2024-001',
    key_hash: '0x1234567890abcdef',
    previous_owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    current_owner: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    onchain_tx_hash: '0xabcdef1234567891',
    block_number: 1000050,
    status: 'finalized',
    transaction_data: {
      location: 'Distribution Center B',
      temperature: '-68',
      notes: 'Transferred to regional distributor'
    },
    metadata: {},
    createdAt: new Date('2024-01-16').toISOString(),
    updatedAt: new Date('2024-01-16').toISOString(),
  },
  {
    id: '3',
    transaction_type: 'register',
    product_id: '00300001234568',
    serial_number: 'SN-2024-002',
    batch_number: 'BATCH-2024-002',
    key_hash: '0x2234567890abcdef',
    previous_owner: null,
    current_owner: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onchain_tx_hash: '0xabcdef1234567892',
    block_number: 1000100,
    status: 'confirmed',
    transaction_data: {
      location: 'Manufacturing Plant C',
      temperature: '4',
      notes: 'Quality control passed'
    },
    metadata: {},
    createdAt: new Date('2024-01-17').toISOString(),
    updatedAt: new Date('2024-01-17').toISOString(),
  },
];

export const mockEntities = [
  {
    id: '1',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    entity_type: 'manufacturer',
    name: 'BioPharm Manufacturing Inc.',
    license_number: 'MFG-2024-001',
    verified: true,
    metadata: {
      location: 'Boston, MA',
      established: '2010'
    }
  },
  {
    id: '2',
    address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    entity_type: 'distributor',
    name: 'Global Pharma Distribution',
    license_number: 'DIST-2024-001',
    verified: true,
    metadata: {
      location: 'New York, NY',
      established: '2015'
    }
  },
];
