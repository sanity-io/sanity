import {cssModulesPattern} from '@repo/css-modules-kit'
import {defineConfig} from '@repo/tsdown.config'
import {Features} from 'lightningcss'

export default defineConfig({
  entry: './src/index.ts',
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
      // The `@sanity/browserslist-config` targets predate `light-dark()`, and Lightning CSS
      // polyfills it with `--lightningcss-light`/`-dark` toggles keyed to `prefers-color-scheme`
      // rather than the computed `color-scheme`, so ship it as authored instead. See
      // https://github.com/parcel-bundler/lightningcss/issues/873
      exclude: Features.LightDark,
    },
  },
})
