import {defineConfig, type Config} from '@pandacss/dev'

// The static styles of the studio: `css()` calls in the `.css.ts` modules next to the
// components, extracted at build time (`panda` in tsdown.config.ts, `@pandacss/vite` in the dev
// studios and test runners) and shipped as `sanity/bundle.css` — without Panda's cascade layers
// (`cascadeLayers: false` in tsdown.config.ts, `unlayeredPandaCss()` in @repo/pandacss), so the
// default layer names here never reach a page. `satisfies Config` makes the type checker reject
// options that do not exist, which `defineConfig` alone lets through.
export default defineConfig({
  include: ['./src/**/*.css.ts', './src/**/*.css.tsx'],
  importMap: '#styled-system',
  // Class names are `sanity-` plus a 32-bit hash of the style key (`display: flex` →
  // `sanity-HgOzd`). A style that changes gets a new name, so a release cannot reuse the names of
  // the previous one for different rules (SAPP-4639), and the prefix keeps the names apart from
  // the other Panda builds on the page (`@sanity/ui`, `@sanity/vision`).
  hash: true,
  prefix: 'sanity',
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
    '#sanity': {'--static-css-file-loaded-studio': 'true'},
  },
} satisfies Config)
