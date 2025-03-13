import app from './app';


const PORT = process.env.BE_PORT;

Bun.serve({
  port: PORT,
  fetch: app.fetch, // Required in Hono with Bun for handling fetch requests
  idleTimeout: 90,
});
console.log(`Server running at http://localhost:${PORT}`);
