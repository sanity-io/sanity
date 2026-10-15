import {unlayeredPandaCss} from '@repo/pandacss/tsdown'
import {defineConfig} from '@repo/tsdown.config'
import {mergeConfig, type UserConfig} from 'tsdown'

const config: UserConfig = mergeConfig(
  await defineConfig({
    entry: './src/index.ts',
    // React Compiler on oxc-transform-react (the native Rust port), see packages/sanity/tsdown.config.ts
    reactCompiler: {transform: 'oxc', target: '19'},
    // Rewrites the `css()` calls of the Panda CSS `.css.ts` files (panda.config.ts) into class
    // names, extracts their CSS into `lib/bundle.css` and wires up the conditional `./bundle.css`
    // export pattern (self-referential import + node shim), like the `rollup: {vanillaExtract: true}`
    // option in `@sanity/pkg-utils` did for vanilla-extract.
    // The `import '@sanity/vision/bundle.css'` this injects into the entry barrel is also why
    // package.json declares `sideEffects: true`: with `false` or a `*.css` allowlist, bundlers
    // bypass the side-effect-free barrel and eliminate the bare CSS import together with it, before
    // the stylesheet's own side-effect status is ever consulted (see #13322 and #13332)
    panda: {minify: true},
  }),
  // Strips the cascade layers from `lib/bundle.css`, see packages/sanity/tsdown.config.ts
  {plugins: [unlayeredPandaCss()]},
)

export default config
