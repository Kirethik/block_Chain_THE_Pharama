export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '137'),
  networkName: process.env.NEXT_PUBLIC_NETWORK_NAME || 'polygon',
};

export const networks = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    rpc: 'https://eth-mainnet.g.alchemy.com/v2/your-key',
    consensus: 'Proof of Stake',
    confirmations: 2,
    blockTime: 12
  },
  polygon: {
    id: 137,
    name: 'Polygon',
    rpc: 'https://polygon-rpc.com',
    consensus: 'PoS + Checkpointing',
    confirmations: 10,
    blockTime: 2
  },
  localhost: {
    id: 31337,
    name: 'Localhost',
    rpc: 'http://127.0.0.1:8545',
    consensus: 'Development',
    confirmations: 1,
    blockTime: 1
  }
};
