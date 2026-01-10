import {type Plugin} from 'vite'

/**
 * Options for the Sanity schema extraction plugin.
 * @public
 */
export interface SchemaExtractionPluginOptions {
  /**
   * Working directory for schema extraction.
   */
  workDir?: string
}

/**
 * Vite plugin that extracts Sanity schema during development.
 * @public
 */
export function sanitySchemaExtractionPlugin(_options: SchemaExtractionPluginOptions = {}): Plugin {
  return {
    name: 'sanity/schema-extraction',
    // TODO: Implement schema extraction
  }
}
