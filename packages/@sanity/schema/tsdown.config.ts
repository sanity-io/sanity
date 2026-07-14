import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: {
    index: './src/_exports/index.ts',
    _internal: './src/_exports/_internal.ts',
  },
  // A few schema types reference React types (e.g. `icon?: ComponentType`), but `react` is not
  // a dependency of this package, so `@types/react` must stay an external import in the
  // generated `.d.ts` files (it also uses CommonJS dts syntax, which cannot be bundled)
  deps: {dts: {neverBundle: ['react']}},
})
