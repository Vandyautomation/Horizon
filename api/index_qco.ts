import app from './app';

const PORT = process.env.BE_QCO_PORT || 9996;

// Catch async rejections
process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

// Start the Bun server
Bun.serve({
  port: PORT,
  fetch: app.fetch,
  idleTimeout: 90,
});

console.log(`✅ Server running at http://localhost:${PORT}`);
