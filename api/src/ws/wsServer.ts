import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import jwt from 'jsonwebtoken';

interface AuthedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

const wss = new WebSocketServer({ noServer: true });

// userId -> Set of open sockets
const rooms = new Map<string, Set<AuthedSocket>>();

// ── Attach to HTTP server ─────────────────────────────────────

export function attachWebSocketServer(server: Server) {
  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    // Expect token as query param: /ws?token=<jwt>
    const url = new URL(req.url ?? '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      userId = payload.userId;
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      (ws as AuthedSocket).userId = userId;
      (ws as AuthedSocket).isAlive = true;
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws: AuthedSocket) => {
    const userId = ws.userId!;

    // Join room
    if (!rooms.has(userId)) rooms.set(userId, new Set());
    rooms.get(userId)!.add(ws);

    // Send initial ping
    ws.send(JSON.stringify({ type: 'connected', userId }));

    // Heartbeat
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('close', () => {
      rooms.get(userId)?.delete(ws);
      if (rooms.get(userId)?.size === 0) rooms.delete(userId);
    });

    ws.on('error', () => ws.terminate());
  });

  // Ping all clients every 30s, terminate dead ones
  setInterval(() => {
    wss.clients.forEach((ws) => {
      const s = ws as AuthedSocket;
      if (!s.isAlive) return s.terminate();
      s.isAlive = false;
      s.ping();
    });
  }, 30_000);

  console.log('[WS] WebSocket server attached');
}

// ── Broadcast to all sockets for a user ──────────────────────

export function broadcast(userId: string, event: object) {
  const sockets = rooms.get(userId);
  if (!sockets || sockets.size === 0) return;
  const msg = JSON.stringify(event);
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

// ── Event helpers ─────────────────────────────────────────────

export function broadcastFrontChange(userId: string) {
  broadcast(userId, { type: 'front_changed' });
}

export function broadcastMembersChanged(userId: string) {
  broadcast(userId, { type: 'members_changed' });
}