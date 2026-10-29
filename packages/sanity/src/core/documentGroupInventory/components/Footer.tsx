import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const Footer = styled.div(({theme}) => {
  const {space} = getThemeV2(theme)

  return css`
    display: flex;
    padding-inline: ${space[4]}px;
    padding-block-start: calc(${space[5]}px * 0.5);
    padding-block-end: ${space[4]}px;
    gap: ${space[3]}px;
    justify-content: end;
  `
})
