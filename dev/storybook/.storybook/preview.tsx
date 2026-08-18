// @sanity/ui ships its static styles as a stylesheet consumers import
// themselves; load it the same way the studio entry point and the browser
// test setup (packages/sanity/test/setup/browser.ts) do. `ui5/styles.css` is
// imported as a side effect of the `sanity` package entry, so it does not
// need to be loaded here.
import '@sanity/ui/styles.css'

import {Card, LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme, type RootTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {type Decorator, type Preview} from '@storybook/react-vite'

const studioTheme: RootTheme = buildTheme()

/**
 * Provides the studio theme to every story. Stories that reuse the browser
 * test harnesses (`TestWrapper`) nest their own `ThemeProvider` with the same
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
