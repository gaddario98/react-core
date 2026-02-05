import { atomStateGenerator } from '@gaddario98/react-state';
import type { NotificationMessage } from './types';

const {
  atom: notificationAtom,
  useValue: useNotificationValue,
  useState: useNotificationState,
} = atomStateGenerator<NotificationMessage | null>({
  defaultValue: null,
  key: 'reactNotificationAtom',
  persist: false,
});

export { notificationAtom, useNotificationValue, useNotificationState };
