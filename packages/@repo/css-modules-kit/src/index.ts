/**
 * How Lightning CSS renames the classes, `@keyframes` and container names of a CSS module: the
 * `generateScopedName` of a package's tsdown `css.modules` option, and the `cssModules.pattern` of
 * every Vite build that compiles the same sources ({@link viteCssModules}).
 *
 * Hashing the stylesheet's content rather than its path keeps the names identical between the two:
 * Vite forces Lightning CSS's `projectRoot` to its own root, so a path hash could never match the
 * package build's. And a release that changes a file's styles gets new names for them, so a page
 * that loads the stylesheets of two releases cannot style elements with the wrong release's rules
 * (what `identifiers: 'safe'` did for vanilla-extract, SAPP-4639).
 */
export const cssModulesPattern = '[content-hash]_[local]'

/**
 * The `css` options for a Vite config that compiles a package's CSS modules from source (a dev
 * studio, vitest, a CDN bundle): Lightning CSS instead of PostCSS, so the scoping matches the
 * package build's (PostCSS modules would leave container names global), with
 * {@link cssModulesPattern}, so the class names match too. Merge it with `mergeConfig`, which
 * keeps the rest of an existing `css.lightningcss` (such as an `exclude`).
 */
export const viteCssModules = {
  transformer: 'lightningcss',
  lightningcss: {cssModules: {pattern: cssModulesPattern}},
} as const
