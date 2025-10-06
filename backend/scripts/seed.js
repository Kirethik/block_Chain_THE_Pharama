const { sequelize, Product, Entity, syncModels } = require('../src/models');
const EthCrypto = require('eth-crypto');

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    await sequelize.authenticate();
    await syncModels();

    // Create sample entities with key pairs
    console.log('Creating entities...');
    
    const manufacturerIdentity = EthCrypto.createIdentity();
    const distributorIdentity = EthCrypto.createIdentity();
    const pharmacyIdentity = EthCrypto.createIdentity();

    const manufacturer = await Entity.create({
      ethereum_address: manufacturerIdentity.address,
      entity_name: 'Pfizer Inc.',
      entity_type: 'manufacturer',
      public_key: manufacturerIdentity.publicKey,
      gln: '0614141000005',
      license_number: 'MFG-001-US',
      contact_info: {
        email: 'contact@pfizer.com',
        phone: '+1-234-567-8900',
        address: '235 East 42nd Street, New York, NY 10017'
      },
      verified: true,
      active: true
    });
    console.log(`✓ Manufacturer created: ${manufacturer.entity_name}`);
    console.log(`  Address: ${manufacturer.ethereum_address}`);
    console.log(`  Private Key: ${manufacturerIdentity.privateKey}\n`);

    const distributor = await Entity.create({
      ethereum_address: distributorIdentity.address,
      entity_name: 'McKesson Corporation',
      entity_type: 'distributor',
      public_key: distributorIdentity.publicKey,
      gln: '0614141000012',
      license_number: 'DIST-001-US',
      contact_info: {
        email: 'contact@mckesson.com',
        phone: '+1-234-567-8901',
        address: '6555 N State Hwy 161, Irving, TX 75039'
      },
      verified: true,
      active: true
    });
    console.log(`✓ Distributor created: ${distributor.entity_name}`);
    console.log(`  Address: ${distributor.ethereum_address}`);
    console.log(`  Private Key: ${distributorIdentity.privateKey}\n`);

    const pharmacy = await Entity.create({
      ethereum_address: pharmacyIdentity.address,
      entity_name: 'CVS Pharmacy',
      entity_type: 'pharmacy',
      public_key: pharmacyIdentity.publicKey,
      gln: '0614141000029',
      license_number: 'PHARM-001-US',
      contact_info: {
        email: 'contact@cvs.com',
        phone: '+1-234-567-8902',
        address: '1 CVS Drive, Woonsocket, RI 02895'
      },
      verified: true,
      active: true
    });
    console.log(`✓ Pharmacy created: ${pharmacy.entity_name}`);
    console.log(`  Address: ${pharmacy.ethereum_address}`);
    console.log(`  Private Key: ${pharmacyIdentity.privateKey}\n`);

    // Create sample products
    console.log('Creating products...');

    await Product.create({
      product_id: '00300001234567',
      product_name: 'COVID-19 Vaccine (Pfizer-BioNTech)',
      manufacturer: 'Pfizer Inc.',
      manufacturer_address: manufacturer.ethereum_address,
      description: 'mRNA-based COVID-19 vaccine',
      category: 'Vaccine',
      requires_cold_chain: true,
      expiry_period_days: 270,
      regulatory_approvals: {
        FDA: 'BLA-125742',
        EMA: 'EU/1/20/1528',
        WHO: 'EUL-0001'
      },
      active: true
    });
    console.log('✓ Product: COVID-19 Vaccine');

    await Product.create({
      product_id: '00300001234574',
      product_name: 'Insulin Glargine 100 Units/mL',
      manufacturer: 'Pfizer Inc.',
      manufacturer_address: manufacturer.ethereum_address,
      description: 'Long-acting insulin analog',
      category: 'Insulin',
      requires_cold_chain: true,
      expiry_period_days: 730,
      regulatory_approvals: {
        FDA: 'NDA-021081',
        EMA: 'EU/1/00/133'
      },
      active: true
    });
    console.log('✓ Product: Insulin Glargine');

    await Product.create({
      product_id: '00300001234581',
      product_name: 'Amoxicillin 500mg Capsules',
      manufacturer: 'Pfizer Inc.',
      manufacturer_address: manufacturer.ethereum_address,
      description: 'Broad-spectrum antibiotic',
      category: 'Antibiotic',
      requires_cold_chain: false,
      expiry_period_days: 1095,
      regulatory_approvals: {
        FDA: 'ANDA-065113'
      },
      active: true
    });
    console.log('✓ Product: Amoxicillin\n');

    console.log('✅ Seed completed successfully!\n');
    console.log('💡 Save these private keys for testing:\n');
    console.log('Manufacturer:', manufacturerIdentity.privateKey);
    console.log('Distributor:', distributorIdentity.privateKey);
    console.log('Pharmacy:', pharmacyIdentity.privateKey);

    process.exit(0);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
