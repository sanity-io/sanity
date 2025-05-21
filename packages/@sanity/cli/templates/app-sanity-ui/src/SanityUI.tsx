import {ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {createGlobalStyle} from 'styled-components'

const theme = buildTheme()

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
    padding: 0;
  }
`

export function SanityUI({children}: {children: React.ReactNode}) {
  return (
    <>
      <GlobalStyle />
      <ThemeProvider theme={theme}>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </>
  )
}
