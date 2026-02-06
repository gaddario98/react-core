import { atomStateGenerator } from "../state";
import type { AuthState } from "./types";

const {
  atom: authAtom,
  useValue: useAuthValue,
  useState: useAuthState,
} = atomStateGenerator<AuthState | null>({
  defaultValue: null,
  key: "reactAuthStore",
  persist: true,
});
export { authAtom, useAuthValue, useAuthState };
