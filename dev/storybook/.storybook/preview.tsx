// The libraries ship static styles as stylesheets consumers import themselves.
// The ui5 import lives with the package that owns the migration while this host
// keeps direct ui5 imports out of dev tooling.
// oxlint-disable-next-line import/no-unassigned-import -- Storybook needs the package-owned ui5 global styles
import '../../../packages/sanity/test/storybook/ui5Styles'
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
