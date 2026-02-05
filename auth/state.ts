import { atomStateGenerator } from '@gaddario98/react-state'
import type { AuthState } from '.'

const {
  atom: authAtom,
  useValue: useAuthValue,
  useState: useAuthState,
} = atomStateGenerator<AuthState | null>({
  defaultValue: null,
  key: 'reactAuthStore',
  persist: true,
})
export { authAtom, useAuthValue, useAuthState }
