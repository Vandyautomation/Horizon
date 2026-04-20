import app from './app';
import { startZhafirHourlyCarryForwardScheduler } from './controllers/zhafirController';
// import { startTrendkHourlyAggregationScheduler } from './controllers/machineController';
import { resetPool } from './config/database';

const PORT = process.env.BE_PORT || 9999;
console.log('Current working directory:', process.cwd());

function isTediousParserCrash(err: unknown) {
  const text = String((err as any)?.message || err || '').toLowerCase();
  const stack = String((err as any)?.stack || '').toLowerCase();
  return (
    stack.includes('tedious') &&
    (
      text.includes('unsupported numeric datalength') ||
      text.includes('unsupported datalength') ||
      text.includes('unknown type:') ||
      text.includes('unexpected end of data')
    )
  );
}

let resettingPool = false;
async function tryResetDbPool() {
  if (resettingPool) return;
  resettingPool = true;
  try {
    await resetPool();
    console.warn('DB pool reset after tedious parser crash.');
  } catch (poolErr) {
    console.error('Failed to reset DB pool:', poolErr);
  } finally {
    resettingPool = false;
  }
}

// Catch async rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  if (isTediousParserCrash(reason)) {
    console.warn('Tedious parser crash intercepted. Keeping server alive.');
    void tryResetDbPool();
    return;
  }
  process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (isTediousParserCrash(err)) {
    console.warn('Tedious parser crash intercepted. Keeping server alive.');
    void tryResetDbPool();
    return;
  }
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
// TrendK dimatikan sementara.
// startTrendkHourlyAggregationScheduler();
