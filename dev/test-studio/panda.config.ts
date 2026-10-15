import {defineConfig, type Config} from '@pandacss/dev'
import {pandaLayers} from '@repo/pandacss/layer-order'
import {STYLE_SYSTEMS} from '@repo/utils/style-systems'

import {STYLE_OUTLINE_ATTRIBUTE} from './plugins/style-outline/styleSystems'

// The static styles of the test studio's own plugins (`plugins/**/*.css.ts`), built by the
// `@pandacss/vite` instance `studioPandaCss()` adds for this directory (see sanity.cli.ts). Set up
// like packages/sanity/panda.config.ts, with its own class name prefix.
export default defineConfig({
  include: ['./plugins/**/*.css.ts'],
  importMap: '#styled-system',
  hash: true,
  prefix: 'test-studio',
  // Prefixed like the class names, so the layers never merge with the `sanity-*` ones
  layers: pandaLayers('test-studio'),
  preflight: false,
  presets: [],
  jsxStyleProps: 'none',
  shorthands: false,
  forceImportExtension: true,
  strictPropertyValues: true,
  // The debug outlines of the style-outline widget: one rule per style system, painted over the
  // nodes that system rendered while the system is selected in the widget. Overlapping nodes (eg
  // a `styled(ui5Box)`) match several systems at once, and styled-components must win so the debt
  // stays visible. Its exclusion `:not()` gives it the higher specificity today; keep it last in
  // STYLE_SYSTEMS so it still wins on order should that exclusion ever go away.
  globalCss: Object.fromEntries(
    STYLE_SYSTEMS.map(({id, color, selector}) => [
      `html[${STYLE_OUTLINE_ATTRIBUTE}~="${id}"] ${selector}`,
      {
        outline: `1px solid ${color} !important`,
        outlineOffset: '-1px',
      },
    ]),
  ),
} satisfies Config)
