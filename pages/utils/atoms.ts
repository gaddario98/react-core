import { atom } from 'jotai'
import { atomFamily } from 'jotai-family'

export const pageVariablesAtomFamily = atomFamily((_pageId: string) =>
  atom<Record<string, unknown>>({}),
)

/**
 * Global atom storing all page variables.
 * Key format: "scopeId:pageId"
 */
export const pageVariablesAtom = atom<Record<string, Record<string, unknown>>>({})

/**
 * Helper to generate composite keys for page variables.
 */
export const getPageVariablesCompositeKey = (scopeId: string, key: string): string =>
  `${scopeId}:${key}`

/**
 * Creates a derived atom for accessing page variables of a specific scope.
 */
export const createScopePageVariablesAtom = (scopeId: string) =>
  atom(
    (get) => {
      const allPageVariables = get(pageVariablesAtom)
      const prefix = `${scopeId}:`
      const scopePageVariables: Record<string, Record<string, unknown>> = {}

      for (const [key, value] of Object.entries(allPageVariables)) {
        if (key.startsWith(prefix)) {
          scopePageVariables[key.slice(prefix.length)] = value
        }
      }

      return scopePageVariables
    },
    (get, set, update: Record<string, Record<string, unknown>>) => {
      const allPageVariables = get(pageVariablesAtom)
      const prefix = `${scopeId}:`
      const newPageVariables = { ...allPageVariables }

      // Remove old scope entries
      for (const key of Object.keys(newPageVariables)) {
        if (key.startsWith(prefix)) {
          delete newPageVariables[key]
        }
      }

      // Add new scope entries
      for (const [key, value] of Object.entries(update)) {
        newPageVariables[`${prefix}${key}`] = value
      }

      set(pageVariablesAtom, newPageVariables)
    },
  )
