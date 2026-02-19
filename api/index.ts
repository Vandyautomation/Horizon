import app from './app';
import { startZhafirHourlyCarryForwardScheduler } from './controllers/zhafirController';

const PORT = process.env.BE_PORT || 9999;
console.log('Current working directory:', process.cwd());

// Catch async rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the Bun server
Bun.serve({
  port: PORT,
  fetch: app.fetch,
  idleTimeout: 90,
});

console.log(`Server running at http://localhost:${PORT}`);
startZhafirHourlyCarryForwardScheduler();
