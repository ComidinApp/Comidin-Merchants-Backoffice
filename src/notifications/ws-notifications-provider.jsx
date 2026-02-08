import PropTypes from 'prop-types';
import { useRef, useEffect } from 'react';

import { useAuthContext } from 'src/auth/hooks';

import { useNotifications } from './notifications-context';

const { VITE_WS_URL } = import.meta.env;

function getCommerceId(user) {
  return user?.commerce?.id ?? user?.commerce_id ?? user?.commerceId ?? null;
}

export default function WsNotificationsProvider({ children }) {
  const { user } = useAuthContext();
  const { addNotification } = useNotifications();

  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    addNotification({
    id: crypto.randomUUID(),
    title: 'Pedido #3123',
    description: 'Nuevo pedido recibido!',
    type: 'order_notification',
    createdAt: Date.now(),
    isUnRead: true,
    });
    const commerceId = getCommerceId(user);
    let closedByUs = false;

    const cleanup = () => {
      closedByUs = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    if (!user || !commerceId || !VITE_WS_URL) {
      cleanup();
      return cleanup; // consistent-return
    }

    const connect = () => {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const ws = new WebSocket(VITE_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        ws.send(
          JSON.stringify({
            action: 'register',
            commerceId,
            userId: user?.id ?? user?.employee_id ?? null,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          addNotification({
            id: msg.id ?? crypto.randomUUID(),
            title: msg.title ?? 'Nueva notificación',
            description: msg.mensaje ?? msg.description ?? JSON.stringify(msg),
            type: msg.type ?? 'order_notification',
            createdAt: msg.createdAt ?? Date.now(),
            isUnRead: true,
          });
        } catch {
          addNotification({
            id: crypto.randomUUID(),
            title: 'Notificación',
            description: String(event.data),
            type: 'raw',
            createdAt: Date.now(),
            isUnRead: true,
          });
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closedByUs) return;

        const attempt = retryRef.current + 1;
        retryRef.current = attempt;

        const delay = Math.min(30000, 1000 * 2 ** Math.min(attempt, 5));
        reconnectTimerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // noop: onclose hace la reconexión
      };
    };

    connect();

    return cleanup;
  }, [user, addNotification]);

  return <>{children}</>;
}

WsNotificationsProvider.propTypes = { children: PropTypes.node };
