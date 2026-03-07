import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/^http/, 'ws');

type WSEvent = 'front_changed' | 'members_changed' | 'connected';

type Handler = () => void;

export function useWebSocket(handlers: Partial<Record<WSEvent, Handler>>) {
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(() => {
    const token = localStorage.getItem('plural_token');
    if (!token) return;

    const url = `${WS_BASE}/ws?token=${encodeURIComponent(token)}`;
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log('[WS] Connected');
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const handler = handlersRef.current[data.type as WSEvent];
        if (handler) handler();
      } catch {}
    };

    socket.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in 3s');
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    socket.onerror = () => socket.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);
}