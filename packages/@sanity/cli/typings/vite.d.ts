/* eslint-disable @typescript-eslint/no-empty-interface */

/**
 * Rely on declaration merging so that this package doesn't have
 * to depend on `vite` directly
 * @see UserViteConfig
 */
declare module 'vite' {
  export interface InlineConfig {}
  export interface ConfigEnv {}
}
