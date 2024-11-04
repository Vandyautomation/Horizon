import app from './app';


const PORT = 3000;

Bun.serve({
  port: 3000,
  fetch: app.fetch, // Required in Hono with Bun for handling fetch requests
});
console.log(`Server running at http://localhost:${PORT}`);
