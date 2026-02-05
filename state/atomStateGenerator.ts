import { atom, useAtom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'
import { storage } from './storage'
import type { PrimitiveAtom } from 'jotai'

export type { PrimitiveAtom } from 'jotai'

export type AtomGeneratorOptions<T> = {
  key: string
  defaultValue: T
  persist?: boolean
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
}

export type AtomState<T> = {
  atom: PrimitiveAtom<T>
  useValue: () => T
  useState: () => [T, (value: T) => void]
  useReset: () => () => void
}

// Overload per persist = true
export function atomStateGenerator<T>(
  options: AtomGeneratorOptions<T> & { persist: true },
): AtomState<T>

// Overload per persist = false o undefined
export function atomStateGenerator<T>(
  options: AtomGeneratorOptions<T> & { persist?: false },
): AtomState<T>

// Implementazione
export function atomStateGenerator<T>({
  key,
  defaultValue,
  persist = false,
  storage: customStorage,
}: AtomGeneratorOptions<T>): AtomState<T> {
  const resolvedStorage = customStorage || storage

  // Usa atomWithStorage solo se persist è true, altrimenti atom normale
  const jotaiAtom = persist
    ? atomWithStorage<T>(
        key,
        defaultValue,
        createJSONStorage<T>(() => resolvedStorage),
      )
    : atom<T>(defaultValue)

  const useValue = () => {
    const [value] = useAtom(jotaiAtom as PrimitiveAtom<T>)
    return value
  }

  const useState = () => {
    const [value, setValue] = useAtom(jotaiAtom as PrimitiveAtom<T>)
    return [value, setValue] as [T, (value: T) => void]
  }

  const useReset = () => {
    const [, setValue] = useAtom(jotaiAtom as PrimitiveAtom<T>)
    return () => {
      setValue(defaultValue)
      // Rimuovi dallo storage solo se era persistente
      if (persist) {
        resolvedStorage.removeItem(key)
      }
    }
  }

  return {
    atom: jotaiAtom as PrimitiveAtom<T>,
    useValue,
    useState,
    useReset,
  }
}
