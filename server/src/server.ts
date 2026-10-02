import http from 'node:http';
import { RoomManager } from './rooms.js';
import { setupWebSocketServer } from './websocket.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const roomManager = new RoomManager();

const server = http.createServer((req, res) => {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'ByteSend Signaling Server',
      timestamp: new Date().toISOString(),
      stats: roomManager.getStats(),
    }));
    return;
  }

  if (req.url === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(roomManager.getStats()));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Attach WebSocket signaling
setupWebSocketServer(server, roomManager);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ByteSend] Signaling server running on http://0.0.0.0:${PORT}`);
  console.log(`[ByteSend] WebSocket endpoint available at ws://0.0.0.0:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[ByteSend] Shutting down signaling server...');
  roomManager.close();
  server.close(() => {
    process.exit(0);
  });
});
