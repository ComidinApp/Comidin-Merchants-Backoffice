import PropTypes from 'prop-types';
import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';

const NotificationsContext = createContext(null);

const initialState = {
  notifications: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { ...state, notifications: [action.payload, ...state.notifications] };

    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, isUnRead: false })),
      };

    case 'SET':
      return { ...state, notifications: action.payload };

    case 'CLEAR':
      return { ...state, notifications: [] };

    default:
      return state;
  }
}

export function NotificationsProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addNotification = useCallback((notification) => {
    dispatch({ type: 'ADD', payload: notification });
  }, []);

  const markAllRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const setNotifications = useCallback((notifications) => {
    dispatch({ type: 'SET', payload: notifications });
  }, []);

  const clearNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => n.isUnRead).length,
    [state.notifications]
  );

  const value = useMemo(
    () => ({
      notifications: state.notifications,
      unreadCount,
      addNotification,
      markAllRead,
      setNotifications,
      clearNotifications,
    }),
    [state.notifications, unreadCount, addNotification, markAllRead, setNotifications, clearNotifications]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

NotificationsProvider.propTypes = { children: PropTypes.node };

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
