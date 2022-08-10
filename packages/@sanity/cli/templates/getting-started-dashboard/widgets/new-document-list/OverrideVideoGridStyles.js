import {css, createGlobalStyle} from 'styled-components'

// This changes the grid columns in the SanityTutorials widget to match the grid of this widget
const media = {
  small: (...args) =>
    css`
      @media (min-width: ${({theme}) => theme.sanity.media[0]}px) {
        ${css(...args)}
      }
    `,
  medium: (...args) =>
    css`
      @media (min-width: ${({theme}) => theme.sanity.media[2]}px) {
        ${css(...args)}
      }
    `,
}

export const OverrideVideoGridStyles = createGlobalStyle`
    :root & [data-widget-name="sanity-tutorials"] [data-ui="Grid"] {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  
      ${media.medium`
        grid-template-columns: repeat(auto-fit, minmax(250px, 2fr));
      `}
    }
  `
