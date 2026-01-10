import {type Plugin} from 'vite'

import {type SchemaExtractionPluginOptions} from './plugin-schema-extraction'

/**
 * Options for the Sanity Studio Vite plugin.
 * @public
 */
export interface SanityStudioPluginOptions {
  /**
   * Path to sanity.config.ts file.
   * Auto-discovered if omitted.
   */
  configPath?: string

  /**
   * Base path where Studio is mounted.
   * @defaultValue '/'
   */
  basePath?: string

  /**
   * Enable React strict mode.
   * @defaultValue true
   */
  reactStrictMode?: boolean

  /**
   * Enable schema extraction during dev.
   * Can be boolean or options object.
   * @defaultValue false
   */
  schemaExtraction?: boolean | Omit<SchemaExtractionPluginOptions, 'workDir'>
}

const VIRTUAL_ENTRY_ID = 'virtual:sanity/entry'
const VIRTUAL_HTML_ID = 'virtual:sanity/index.html'
const RESOLVED_VIRTUAL_ENTRY_ID = '\0' + VIRTUAL_ENTRY_ID
const RESOLVED_VIRTUAL_HTML_ID = '\0' + VIRTUAL_HTML_ID

/**
 * Vite plugin that serves Sanity Studio.
 * @public
 */
export function sanityStudioPlugin(options: SanityStudioPluginOptions = {}): Plugin[] {
  const {
    configPath: configPathOption,
    basePath = '/',
    reactStrictMode = true,
    schemaExtraction = false,
  } = options

  // Will be resolved in configResolved
  let resolvedRoot: string
  let resolvedConfigPath: string | null
  let resolvedBasePath: string

  const plugins: Plugin[] = []

  // Main plugin
  plugins.push({
    name: 'sanity/studio',
    // TODO: Implement plugin hooks
  })

  return plugins
}
