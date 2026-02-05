/**
 * LLMs.txt Generation Support
 *
 * Generates `llms.txt` and `llms-full.txt` content following the
 * llms.txt specification (https://llmstxt.org/).
 *
 * The llms.txt file helps LLMs and AI agents discover what a site offers
 * and where to find key documentation/content.
 *
 * @module integrations/llms
 */

import type { LlmsTxtConfig, LlmsTxtEntry } from '../config/types'

/**
 * Generate llms.txt content from configuration.
 *
 * Format (per spec):
 * ```
 * # Site Name
 *
 * > Brief description of the site
 *
 * ## Docs
 *
 * - [Title](url): Description
 * - [Title](url): Description
 * ```
 *
 * @example
 * ```ts
 * const content = generateLlmsTxt({
 *   siteName: 'My App',
 *   siteDescription: 'A great application for doing things.',
 *   entries: [
 *     { url: '/docs/getting-started', title: 'Getting Started', description: 'How to set up My App' },
 *     { url: '/docs/api', title: 'API Reference', description: 'Complete API documentation' },
 *   ],
 * });
 * // Write `content` to /llms.txt
 * ```
 */
export function generateLlmsTxt(config: LlmsTxtConfig): string {
  const lines: Array<string> = []

  // Header
  lines.push(`# ${config.siteName}`)
  lines.push('')

  // Description
  if (config.siteDescription) {
    lines.push(`> ${config.siteDescription}`)
    lines.push('')
  }

  // Entries grouped under "Docs"
  if (config.entries.length > 0) {
    lines.push('## Docs')
    lines.push('')

    config.entries.forEach((entry) => {
      const desc = entry.description ? `: ${entry.description}` : ''
      lines.push(`- [${entry.title}](${entry.url})${desc}`)
    })

    lines.push('')
  }

  return lines.join('\n')
}

/**
 * Generate a full markdown version (llms-full.txt) that includes
 * more detailed content for each entry.
 *
 * This is useful for providing LLMs with the complete documentation
 * in a single file.
 */
export function generateLlmsFullTxt(
  config: LlmsTxtConfig,
  pageContents: Array<{ entry: LlmsTxtEntry; markdown: string }>,
): string {
  const lines: Array<string> = []

  lines.push(`# ${config.siteName}`)
  lines.push('')

  if (config.siteDescription) {
    lines.push(`> ${config.siteDescription}`)
    lines.push('')
  }

  pageContents.forEach(({ entry, markdown }) => {
    lines.push(`## ${entry.title}`)
    lines.push('')
    if (entry.description) {
      lines.push(`> ${entry.description}`)
      lines.push('')
    }
    lines.push(`Source: ${entry.url}`)
    lines.push('')
    lines.push(markdown)
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Helper to convert a ResolvedMetadata + page text into a clean markdown
 * representation suitable for llms-full.txt or standalone .md endpoints.
 *
 * Strips HTML chrome, keeps headings coherent, and prepends metadata summary.
 */
export function pageToMarkdown(options: {
  title: string
  description?: string
  url: string
  content: string
}): string {
  const lines: Array<string> = []

  lines.push(`# ${options.title}`)
  lines.push('')

  if (options.description) {
    lines.push(options.description)
    lines.push('')
  }

  lines.push(`URL: ${options.url}`)
  lines.push('')
  lines.push(options.content)

  return lines.join('\n')
}
