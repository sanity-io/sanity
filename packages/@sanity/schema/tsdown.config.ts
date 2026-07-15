import {defineConfig} from '@repo/tsdown.config'

export default defineConfig({
  entry: {
    index: './src/_exports/index.ts',
    _internal: './src/_exports/_internal.ts',
  },
  // Also wipe the legacy root-level `_internal.js` from older pkg-utils layouts (a string[]
  // replaces the shared `clean: ['lib']` default, so `lib` must be listed explicitly)
  clean: ['lib', '_internal.js'],
  // A few schema types reference React types (e.g. `icon?: ComponentType`), but `react` is not
  // a dependency of this package, so `@types/react` must stay an external import in the
  // generated `.d.ts` files (it also uses CommonJS dts syntax, which cannot be bundled)
  deps: {dts: {neverBundle: ['react']}},
})
