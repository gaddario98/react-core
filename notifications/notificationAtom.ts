import { atomStateGenerator } from "../state";
import type { PrimitiveAtom } from "../state";
import type { NotificationMessage } from "./types";

const {
  atom: _notificationAtom,
  useValue: useNotificationValue,
  useState: useNotificationState,
} = atomStateGenerator<NotificationMessage | null>({
  defaultValue: null,
  key: "reactNotificationAtom",
  persist: false,
});

const notificationAtom: PrimitiveAtom<NotificationMessage | null> = _notificationAtom;

export { notificationAtom, useNotificationValue, useNotificationState };
