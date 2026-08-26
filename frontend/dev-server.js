import { createServer } from 'vite';

async function startDevServer() {
  const server = await createServer({
    configFile: './vite.config.js',
    server: {
      port: 5173,
      host: true,
    },
  });
  await server.listen();
  console.log('⚡ [Vite Dev Server] Frontend running on http://localhost:5173');

  // Keep event loop active
  setInterval(() => {}, 1000 * 60 * 60);
}

startDevServer();
