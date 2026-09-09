// Both libraries ship static styles as stylesheets consumers import
// themselves. Match the studio entry (`packages/sanity/src/_exports/index.ts`)
// rather than relying on a story happening to import `sanity` (TestWrapper
// does; authored ui-components / ui5 sentinels import source files directly
// and would otherwise miss the ui5 reset and design tokens).
import 'ui5/styles.css'
import '@sanity/ui/styles.css'

import {Card, LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme, type RootTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {type Decorator, type Preview} from '@storybook/react-vite'

const studioTheme: RootTheme = buildTheme()

/**
 * Provides the studio theme to every story. Harness stories that render inside
 * the mock studio (`TestWrapper`) nest their own `ThemeProvider` with the same
 * theme, which is a supported no-op. The `Card` gives stories the same themed
 * canvas background the studio has (and respects the color scheme once dark
 * mode snapshots are enabled).
 */
const withStudioTheme: Decorator = (Story) => (
  <ThemeProvider theme={studioTheme}>
    <ToastProvider>
      <LayerProvider>
        <Card style={{minHeight: '100vh'}} tone="default">
          <Story />
        </Card>
      </LayerProvider>
    </ToastProvider>
  </ThemeProvider>
)

const preview: Preview = {
  decorators: [withStudioTheme],
  parameters: {
    layout: 'fullscreen',
    chromatic: {
      // Match the viewport the vitest browser-mode tests render at
      // (packages/sanity/vitest.browser.config.mts) so e.g. the Portable Text
      // toolbar shows all buttons instead of collapsing into an overflow menu.
      modes: {
        desktop: {viewport: {width: 1280, height: 900}},
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
