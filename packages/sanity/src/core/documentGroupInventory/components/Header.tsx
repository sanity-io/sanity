import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const Header = styled.div(({theme}) => {
  const {space} = getThemeV2(theme)

  return css`
    /* Allow this grid item to shrink below its min-content size so nowrap
       text inside can be truncated with an ellipsis */
    min-inline-size: 0;
    padding-inline: ${space[4]}px;
    padding-block-start: ${space[4]}px;
    padding-block-end: calc(${space[5]}px * 0.5);
  `
})
