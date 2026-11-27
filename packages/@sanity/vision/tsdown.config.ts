import {cssModulesPattern} from '@repo/css-modules-kit'
import {defineConfig} from '@repo/tsdown.config'
import {Features} from 'lightningcss'

import pkg from './package.json' with {type: 'json'}

export default defineConfig({
  entry: './src/index.ts',
  define: {
    // `VISION_VERSION` reads this (see `src/version.ts`). An explicit env var wins so preview
    // releases can attach their own version, otherwise the version from package.json is inlined.
    __PKG_VERSION__: JSON.stringify(process.env.PKG_VERSION || pkg.version),
  },
  // React Compiler on oxc-transform-react (the native Rust port), see packages/sanity/tsdown.config.ts
  reactCompiler: {transform: 'oxc', target: '19'},
  // Compiles the `*.module.css` files with Lightning CSS, through `@tsdown/css`, and extracts the
  // CSS into `lib/bundle.css`, wired up as the conditional `./bundle.css` export (self-referential
  // import + node shim) that the package has always published.
  // The `import '@sanity/vision/bundle.css'` this injects into the entry barrel is also why
  // package.json declares `sideEffects: true`: with `false` or a `*.css` allowlist, bundlers
  // bypass the side-effect-free barrel and eliminate the bare CSS import together with it, before
  // the stylesheet's own side-effect status is ever consulted (see #13322 and #13332)
  css: {
    fileName: 'bundle.css',
    // Readable output keeps the CSS diffs between published versions easy to review
    minify: false,
    // `@tsdown/css` sets Lightning CSS's `cssModules` itself from this, over anything in
    // `lightningcss` below, so the rest of the scoping stays at Lightning CSS's defaults (which the
    // `cmkOptions` in tsconfig.json mirror for the generated typings)
    modules: {generateScopedName: cssModulesPattern},
    lightningcss: {
      // Every browser of the package's `browserslist` (Baseline 2026) supports `light-dark()`, so
      // nothing polyfills it today. For targets that predate it, Lightning CSS would polyfill it
      // with `--lightningcss-light`/`-dark` toggles keyed to `prefers-color-scheme` rather than
      // the computed `color-scheme`, so it always ships as authored. See
      // https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.LightDark,
    },
  },
})
