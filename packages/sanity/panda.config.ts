import {defineConfig, type Config} from '@pandacss/dev'

import {
  GLOBAL_STYLES_ATTRIBUTE,
  GLOBAL_STYLES_BUILD_ID,
  GLOBAL_STYLE_VARIABLES,
} from './src/core/studio/globalStyleConstants.ts'

const globalStylesSelector = `[${GLOBAL_STYLES_ATTRIBUTE}=${JSON.stringify(GLOBAL_STYLES_BUILD_ID)}]`
const globalStylesRoot = `:where(html${globalStylesSelector})`

function globalElement(selector: string) {
  return `${globalStylesRoot}${selector}, ${globalStylesRoot} ${selector}`
}

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
    '#sanity': {
      '--static-css-file-loaded-studio': 'true',
    },
    [globalElement('::-webkit-resizer')]: {
      backgroundImage: `var(${GLOBAL_STYLE_VARIABLES.webkitResizerBackgroundImage})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'bottom right',
    },
    [globalElement('::-webkit-scrollbar')]: {
      width: '12px',
      height: '12px',
    },
    [globalElement('::-webkit-scrollbar-corner')]: {
      backgroundColor: 'transparent',
    },
    [globalElement('::-webkit-scrollbar-thumb')]: {
      backgroundClip: 'content-box',
      backgroundColor: `var(--card-border-color, var(${GLOBAL_STYLE_VARIABLES.uiColorBorder}))`,
      border: '4px solid transparent',
    },
    [globalElement('::-webkit-scrollbar-thumb:hover')]: {
      backgroundColor: `var(--card-muted-fg-color, var(${GLOBAL_STYLE_VARIABLES.uiColorMutedFg}))`,
    },
    [globalElement('::-webkit-scrollbar-track')]: {
      background: 'transparent',
    },
    [`${globalStylesRoot}::selection, ${globalStylesRoot} *::selection`]: {
      backgroundColor: `var(${GLOBAL_STYLE_VARIABLES.selectionBackgroundColor})`,
    },
    [`html:where(${globalStylesSelector})`]: {
      backgroundColor: `var(${GLOBAL_STYLE_VARIABLES.uiColorBg})`,
    },
    [`${globalStylesRoot} body`]: {
      scrollbarGutter: 'stable',
    },
    [`${globalStylesRoot} #sanity`]: {
      fontFamily: `var(${GLOBAL_STYLE_VARIABLES.uiFontTextFamily})`,
    },
    [`${globalStylesRoot} b, ${globalStylesRoot} strong`]: {
      fontWeight: `var(${GLOBAL_STYLE_VARIABLES.uiFontTextWeightMedium})`,
    },
  },
} satisfies Config)
