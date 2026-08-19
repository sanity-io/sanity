import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: './src/index.ts',
  reactCompiler: {target: '19'},
  // Extracts the CSS from vanilla-extract `.css.ts` files into `lib/bundle.css` and wires up the
  // conditional `./bundle.css` export pattern (self-referential import + node shim), like the
  // `rollup: {vanillaExtract: true}` option in `@sanity/pkg-utils` did.
  // The `import '@sanity/vision/bundle.css'` this injects into the entry barrel is also why
  // package.json declares `sideEffects: true`: with `false` or a `*.css` allowlist, bundlers
  // bypass the side-effect-free barrel and eliminate the bare CSS import together with it, before
  // the stylesheet's own side-effect status is ever consulted (see #13322 and #13332)
  vanillaExtract: true,
})
