import { useRef, useCallback, useEffect, useState } from 'react';
import type { SignalingMessage } from '../types';

const DEFAULT_SIGNALING_PORT = 3001;
const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_URL ?? (typeof window !== 'undefined' ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.hostname}:${DEFAULT_SIGNALING_PORT}` : 'ws://localhost:3001');

interface UseSignalingProps {
  onMessage: (message: SignalingMessage) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

interface UseSignalingReturn {
  connect: () => void;
  disconnect: () => void;
  send: (message: SignalingMessage) => void;
  isConnected: boolean;
}

export function useSignaling({
  onMessage,
  onConnected,
  onDisconnected,
}: UseSignalingProps): UseSignalingReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(SIGNALING_SERVER_URL);

    ws.onopen = () => {
      setIsConnected(true);
      onConnected?.();
    };

    ws.onclose = () => {
      setIsConnected(false);
      onDisconnected?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as SignalingMessage;
        onMessage(message);
      } catch (err) {
        console.error('Failed to parse signaling message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;
  }, [onMessage, onConnected, onDisconnected]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((message: SignalingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    send,
    isConnected,
  };
}
