import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const Container = styled.div(({theme}) => {
  const {container, space} = getThemeV2(theme)

  return css`
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    inline-size: min(calc(${container[0]}px * 1.5), calc(100vw - (${space[3]}px * 2)));
    max-block-size: 75vh;
    block-size: var(--intrinsic-block-size, auto);
  `
})
