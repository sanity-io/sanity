/**
 * These are used by studios, not internals.
 * Please do not remove this, as it'll break people's studios.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'all:*' {
  const anyArray: any[]

  export default anyArray
}

declare module 'config:*' {
  const pluginConfig: {[key: string]: any}

  export default pluginConfig
}

declare module 'part:*'

declare module '*.css' {
  const cssModule: {[key: string]: string}

  export default cssModule
}
