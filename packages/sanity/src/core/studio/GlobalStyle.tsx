import {createGlobalStyle, css} from 'styled-components'

const SCROLLBAR_SIZE = 14 // px
const SCROLLBAR_BORDER_SIZE = 4 // px

export const GlobalStyle = createGlobalStyle(({theme}) => {
  const {color, fonts} = theme.sanity

  return css`
    ::-webkit-scrollbar {
      width: ${SCROLLBAR_SIZE}px;
      height: ${SCROLLBAR_SIZE}px;
    }

    ::-webkit-scrollbar-thumb {
      background-clip: content-box;
      background-color: ${color.muted.transparent.disabled.fg};
      border-radius: ${SCROLLBAR_SIZE}px;
      border: ${SCROLLBAR_BORDER_SIZE}px solid transparent;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: ${color.muted.transparent.enabled.fg};
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    html {
      background-color: ${color.base.bg};
    }

    #sanity {
      font-family: ${fonts.text.family};
    }

    b {
      font-weight: ${fonts.text.weights.medium};
    }

    strong {
      font-weight: ${fonts.text.weights.medium};
    }
  `
})
