/**
 * Optional dev-only metadata logging.
 *
 * Tracks what metadata was resolved and applied, useful for debugging
 * metadata issues during development.
 *
 * Logging is a no-op in production builds.
 *
 * @module config/metadataLogger
 */

import type { ResolvedMetadata } from './types'

const isDev = process.env.NODE_ENV === 'development'

export interface MetadataLogEntry {
  pageId: string
  action: 'resolve' | 'apply-dom' | 'apply-store' | 'translate'
  metadata: ResolvedMetadata
  timestamp: number
}

let logEnabled = false
const logEntries: Array<MetadataLogEntry> = []

/**
 * Enable or disable metadata logging.
 * Only effective in development mode.
 */
export function setMetadataLogging(enabled: boolean): void {
  logEnabled = isDev && enabled
}

/**
 * Log a metadata action (resolve, apply, translate).
 * No-op in production or when logging is disabled.
 */
export function logMetadata(
  pageId: string,
  action: MetadataLogEntry['action'],
  metadata: ResolvedMetadata,
): void {
  if (!logEnabled) return

  const entry: MetadataLogEntry = {
    pageId,
    action,
    metadata,
    timestamp: Date.now(),
  }

  logEntries.push(entry)

  // Keep only last 50 entries to avoid memory leaks
  if (logEntries.length > 50) {
    logEntries.splice(0, logEntries.length - 50)
  }

  console.log(
    `[Metadata:${action}] page="${pageId}"`,
    metadata.title ? `title="${metadata.title}"` : '',
    metadata.description ? `desc="${metadata.description.slice(0, 60)}..."` : '',
  )
}

/**
 * Get all logged metadata entries (dev only).
 * Useful for inspecting metadata in browser devtools.
 */
export function getMetadataLog(): Array<MetadataLogEntry> {
  return [...logEntries]
}

/**
 * Clear the metadata log.
 */
export function clearMetadataLog(): void {
  logEntries.length = 0
}
