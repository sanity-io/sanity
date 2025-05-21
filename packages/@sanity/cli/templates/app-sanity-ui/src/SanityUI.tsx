import {ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'

const theme = buildTheme()

export function SanityUI({children}: {children: React.ReactNode}) {
  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  )
}
