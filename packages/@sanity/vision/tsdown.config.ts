import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: './src/index.ts',
  reactCompiler: {target: '19'},
  // Extracts the CSS from vanilla-extract `.css.ts` files into `lib/bundle.css` and wires up the
  // conditional `./bundle.css` export pattern (self-referential import + node shim), like the
  // `rollup: {vanillaExtract: true}` option in `@sanity/pkg-utils` did
  vanillaExtract: true,
})
