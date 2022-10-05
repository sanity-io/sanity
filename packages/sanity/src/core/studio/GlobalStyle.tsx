import {createGlobalStyle} from 'styled-components'

export const GlobalStyle = createGlobalStyle(({theme}) => {
  const {color, fonts} = theme.sanity

  return {
    html: {
      backgroundColor: color.base.bg,
    },

    '#sanity': {
      fontFamily: fonts.text.family,
    },
  }
})
