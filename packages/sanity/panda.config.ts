import {defineConfig, type Config} from '@pandacss/dev'

import {studioGlobalCss} from './src/core/studio/globalStyles'

// The static styles of the studio: `css()` calls in the `.css.ts` modules next to the
// components, extracted at build time (`panda` in tsdown.config.ts) and shipped as
// `sanity/bundle.css`. This is the only Panda project in the repository: the dev studios, Storybook
// and the test runners that build the package from source point their `@pandacss/vite` instance at
// this directory (`cwd`), through `@repo/pandacss`. The stylesheet ships without Panda's cascade
// layers (`cascadeLayers: false` in tsdown.config.ts, `removeCascadeLayers()` next to each
// `@pandacss/vite` instance), so the default layer names here never reach a page. `satisfies
// Config` makes the type checker reject options that do not exist, which `defineConfig` alone lets
// through.
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
    // The document-level styles `GlobalStyle` (`src/core/studio/GlobalStyle.tsx`) applies
    ...studioGlobalCss,
    // The presentation tool's iframe viewport transitions (`src/presentation/preview/IFrame.tsx`)
    'html:active-view-transition-type(sanity-iframe-viewport)': {
      'viewTransitionName': 'none',
      '&::view-transition': {
        pointerEvents: 'none',
      },
    },
    // The presentation tool's document list (`src/presentation/editor/DocumentListPane.tsx`): the
    // structure `Pane` inside it sets `max-width` inline, which takes `!important` to override. It
    // cannot come from a `css()` call: there an `!important` value compiles to a class name that
    // the generated stylesheet has no rule for.
    '[data-presentation-document-list-pane] > div': {
      maxWidth: 'none !important',
    },
  },
  // Custom properties the document group inventory's scroll mask animates
  // (`src/core/documentGroupInventory/components/Body.css.ts`), which needs them registered
  globalVars: {
    '--start-mask-color': {syntax: '<color>', inherits: false, initialValue: '#000'},
    '--end-mask-color': {syntax: '<color>', inherits: false, initialValue: '#000'},
  },
} satisfies Config)
