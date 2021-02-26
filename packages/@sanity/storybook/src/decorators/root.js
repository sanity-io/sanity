import {theme as baseTheme} from '@sanity/base'
import {Card, LayerProvider, ThemeProvider, ToastProvider} from '@sanity/ui'
import React from 'react'
import {css, createGlobalStyle} from 'styled-components'

const GlobalStyle = createGlobalStyle(({theme}) => {
  const base = theme.sanity.color.base
  const text = theme.sanity.fonts.text

  return css`
    body,
    html,
    #root {
      height: 100%;
    }

    /* ::selection {
      background: var(--text-selection-color);
    } */

    body {
      background-color: ${base.bg};
      color: ${base.fg};
      font-family: ${text.family};
      font-size: 100%;
      line-height: ${text.sizes[2].lineHeight / text.sizes[2].fontSize};
      -webkit-font-smoothing: antialiased;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      margin: 0;
    }
  `
})

function RootDecorator(story) {
  return (
    <ThemeProvider scheme="light" theme={baseTheme}>
      <ToastProvider zOffset={12000}>
        <LayerProvider>
          <GlobalStyle />
          <Card height="fill">{story()}</Card>
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default RootDecorator
