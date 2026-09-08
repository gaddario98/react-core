import { atomStateGenerator } from "../state";
import type { PrimitiveAtom } from "../state";
import type { AuthState } from "./types";

const {
  atom: _authAtom,
  useValue: useAuthValue,
  useState: useAuthState,
} = atomStateGenerator<AuthState | null>({
  defaultValue: null,
  key: "reactAuthStore",
  persist: true,
});
const authAtom: PrimitiveAtom<AuthState | null> = _authAtom;

export { authAtom, useAuthValue, useAuthState };
