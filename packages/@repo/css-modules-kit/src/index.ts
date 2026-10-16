import {Features} from 'lightningcss'

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
 * {@link cssModulesPattern}, so the class names match too. Excludes the `light-dark()` polyfill
 * (see https://github.com/parcel-bundler/lightningcss/issues/873): Vite's default targets rewrite
 * it to `--lightningcss-light`/`-dark` toggles keyed only to `prefers-color-scheme`, so Studio
 * theme colors would follow the OS instead of `color-scheme` when those disagree.
 */
export const viteCssModules = {
  transformer: 'lightningcss',
  lightningcss: {
    cssModules: {pattern: cssModulesPattern},
    exclude: Features.LightDark,
  },
} as const
