import { useCallback, useEffect, useRef } from 'react';
import { useNotificationState } from './notificationAtom';
import type { NotificationMessage } from './types';

  const useNotificationSet = () => {
    const [, setValue] = useNotificationState();
    return setValue;
  };

export const useNotification = (ns = 'notifications') => {
  const setNotification = useNotificationSet();
  const ref =useRef({setNotification, ns})

  useEffect(() => {
    ref.current = { setNotification, ns };
  }, [setNotification, ns]);

  const showNotification = useCallback(
    (notification: Omit<NotificationMessage, 'id'>) => {
      ref.current.setNotification({
        ns: ref.current.ns,
        ...notification,
        id: Date.now().toString(),
      });
    },
    [],
  );

  const clearNotification = useCallback(() => {
    ref.current.setNotification(null);
  }, []);

  return {
    showNotification,
    clearNotification,
  };
};
