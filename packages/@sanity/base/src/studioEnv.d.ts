/**
 * The dev server tooling aliases this special module to a specific filesystem
 * location (`<studioRoot>/sanity.config.ts` or similar), in order to handle
 * the config as if it as any other source file. This gives it the same
 * affordances as regular files: watch, hot reload, transpile etc. Nice, eh?
 *
 * HOWEVER, this module is only available to import from the `@sanity/base`s
 * `StudioEntry` component. We do not want users to import this config in their
 * plugins/custom code, but instead fetch the config from React context or
 * similar. Why, you ask?
 *
 * 1. It ensures Sanity plugins will continue to work outside the scope of the
 *    Sanity dev tooling. For instance, if rendered inside a Next.js app, the
 *    import would not work without providing additional aliases etc.
 *
 * 2. It lets us replace how the configuration is loaded/provided to the app
 *    without considering ecosystem implications.
 */
declare module '@sanity-studio-config' {
  import {SanityConfig} from '@self/config'

  const studioConfig: SanityConfig

  export default studioConfig
}
