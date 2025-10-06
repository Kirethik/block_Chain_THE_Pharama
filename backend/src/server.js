const app = require("./app");
const { getNetworkHealth } = require("./config/blockchain");

const port = process.env.PORT || 4000;

async function startServer() {
  try {
    // Check blockchain connection
    const health = await getNetworkHealth();
    if (!health.healthy) {
      console.warn("⚠ Warning: Blockchain connection issues detected");
      console.warn("Details:", health);
    } else {
      console.log(`✓ Connected to ${health.network} blockchain (${health.consensus})`);
      console.log(`✓ Current block: ${health.blockNumber}`);
    }

    const server = app.listen(port, () => {
      console.log(`\n🚀 Server running on port ${port}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Blockchain: ${process.env.NETWORK || 'localhost'}`);
      console.log(`\n📚 API Documentation:`);
      console.log(`   Health Check: http://localhost:${port}/api/health`);
      console.log(`   Transactions: http://localhost:${port}/api/transactions`);
      console.log(`   Products: http://localhost:${port}/api/products`);
      console.log(`   Entities: http://localhost:${port}/api/entities\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n⚠ SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✓ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("✗ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
