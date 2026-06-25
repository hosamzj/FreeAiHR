import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import path from 'path';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '5000', 10);

// In production, the .next directory is copied to dist/.next
const dir = dev ? process.cwd() : path.join(process.cwd(), 'dist');

console.log(`[Server] Starting in ${dev ? 'development' : 'production'} mode`);
console.log(`[Server] Next.js directory: ${dir}`);
console.log(`[Server] DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);

// Create Next.js app
const app = next({ dev, hostname, port, dir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });
  server.once('error', err => {
    console.error(err);
    process.exit(1);
  });
  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : 'production'
      }`
    );
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
