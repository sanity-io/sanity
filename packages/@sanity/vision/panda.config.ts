import {defineConfig, type Config} from '@pandacss/dev'

// The static styles of the Vision tool, extracted like those of `sanity` (see
// packages/sanity/panda.config.ts) and shipped as `@sanity/vision/bundle.css`.
export default defineConfig({
  include: ['./src/**/*.css.ts'],
  importMap: '#styled-system',
  // Class names are `vision-` plus a hash of the style key, see packages/sanity/panda.config.ts
  hash: true,
  prefix: 'vision',
  preflight: false,
  presets: [],
  // `styled` in this package is styled-components, not Panda's JSX factory.
  jsxStyleProps: 'none',
  shorthands: false,
  forceImportExtension: true,
  // Catches invalid CSS
  strictPropertyValues: true,
  // Lets a studio verify that the static stylesheet loaded, e.g. with auto-updates
  globalCss: {
    '#sanity': {'--static-css-file-loaded-vision': 'true'},
  },
} satisfies Config)
