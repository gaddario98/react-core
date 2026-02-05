import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'

export type SyncStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const RAW_PREFIX = 'storage:raw:'
const DEFLATE_PREFIX = 'storage:deflate:v1:'

const isProbablyJson = (value: string) => {
  if (!value) return false
  const c = value.charCodeAt(0)
  // { [ " digits, t/f/n (true/false/null)
  return (
    c === 123 ||
    c === 91 ||
    c === 34 ||
    (c >= 48 && c <= 57) ||
    c === 45 ||
    c === 116 ||
    c === 102 ||
    c === 110
  )
}

const u8ToBase64 = (bytes: Uint8Array) => {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

const base64ToU8 = (base64: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

type CompressedStorageOptions = {
  minSizeToCompress?: number
  deflateLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  writeDebounceMs?: number
}

const createCompressedStorage = (
  base: SyncStorage,
  options: CompressedStorageOptions = {},
): SyncStorage => {
  const {
    minSizeToCompress = 1024,
    deflateLevel = 1,
    writeDebounceMs = 50,
  } = options

  const pendingWrites = new Map<string, string>()
  let flushTimer: number | undefined
  let lifecycleHooksInstalled = false

  const flush = () => {
    flushTimer = undefined
    for (const [key, value] of pendingWrites) {
      try {
        if (value.length < minSizeToCompress) {
          base.setItem(key, RAW_PREFIX + value)
          continue
        }

        const input = strToU8(value)
        const compressed = deflateSync(input, { level: deflateLevel })
        base.setItem(key, DEFLATE_PREFIX + u8ToBase64(compressed))
      } catch (error) {
        console.error('Error setting item:', error)
        try {
          base.setItem(key, RAW_PREFIX + value)
        } catch {
          // ignore
        }
      }
    }
    pendingWrites.clear()
  }

  const scheduleFlush = () => {
    if (flushTimer != null) return
    if (!lifecycleHooksInstalled && typeof window !== 'undefined') {
      lifecycleHooksInstalled = true
      window.addEventListener('beforeunload', flush)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flush()
      })
    }
    flushTimer = globalThis.setTimeout(
      flush,
      writeDebounceMs,
    ) as unknown as number
  }

  return {
    getItem: (key: string): string | null => {
      try {
        const stored = base.getItem(key)
        if (!stored) return null

        if (stored.startsWith(RAW_PREFIX)) {
          return stored.slice(RAW_PREFIX.length)
        }

        if (stored.startsWith(DEFLATE_PREFIX)) {
          const b64 = stored.slice(DEFLATE_PREFIX.length)
          const bytes = base64ToU8(b64)
          const decompressed = inflateSync(bytes)
          return strFromU8(decompressed)
        }

        // Back-compat: older versions may have stored raw JSON without any prefix
        if (isProbablyJson(stored)) return stored

        return null
      } catch (error) {
        console.error('Error getting item:', error)
        return null
      }
    },

    setItem: (key: string, value: string) => {
      try {
        // Some upstream serializers can return `undefined` (e.g. JSON.stringify(undefined)).
        const rawValue = value as unknown as string | null | undefined
        if (rawValue == null) {
          pendingWrites.delete(key)
          base.removeItem(key)
          return
        }

        const stringValue = typeof rawValue === 'string' ? rawValue : String(rawValue)
        pendingWrites.set(key, stringValue)
        scheduleFlush()
      } catch (error) {
        console.error('Error setting item:', error)
      }
    },

    removeItem: (key: string) => {
      try {
        pendingWrites.delete(key)
        base.removeItem(key)
      } catch (error) {
        console.error('Error removing item:', error)
      }
    },
  }
}

const baseStorage: SyncStorage = {
  getItem: (key) => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(key)
  },
  setItem: (key, value) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(key, value)
  },
  removeItem: (key) => {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(key)
  },
}

export let storage: SyncStorage = createCompressedStorage(baseStorage)

export const setCustomStorage = (newStorage: SyncStorage) => {
  storage = newStorage
}
