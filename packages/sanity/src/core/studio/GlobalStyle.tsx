import {createGlobalStyle} from 'styled-components'

const SCROLLBAR_SIZE = 14 // px
const SCROLLBAR_BORDER_SIZE = 4 // px

export const GlobalStyle = createGlobalStyle(({theme}) => {
  const {color, fonts} = theme.sanity

  return {
    '::-webkit-scrollbar': {
      width: `${SCROLLBAR_SIZE}px`,
      height: `${SCROLLBAR_SIZE}px`,
    },

    '::-webkit-scrollbar-thumb': {
      backgroundClip: 'content-box',
      backgroundColor: color.muted.transparent.disabled.fg,
      borderRadius: `${SCROLLBAR_SIZE}px`,
      border: `${SCROLLBAR_BORDER_SIZE}px solid transparent`,
    },

    '::-webkit-scrollbar-thumb:hover': {
      backgroundColor: color.muted.transparent.enabled.fg,
    },

    '::-webkit-scrollbar-track': {
      background: 'transparent',
    },

    html: {
      backgroundColor: color.base.bg,
    },

    '#sanity': {
      fontFamily: fonts.text.family,
    },

    b: {
      fontWeight: fonts.text.weights.medium,
    },

    strong: {
      fontWeight: fonts.text.weights.medium,
    },
  }
})
