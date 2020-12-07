const {theme: baseTheme} = require('@sanity/base')
const {Card, ThemeProvider} = require('@sanity/ui')
const React = require('react')
const {css, createGlobalStyle} = require('styled-components')

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

module.exports = function RootDecorator(story) {
  return (
    <ThemeProvider scheme="light" theme={baseTheme}>
      <GlobalStyle />
      <Card style={{height: '100%'}}>{story()}</Card>
    </ThemeProvider>
  )
}
