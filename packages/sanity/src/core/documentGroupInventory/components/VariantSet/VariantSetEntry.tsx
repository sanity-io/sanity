import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const VariantSetEntry = styled.div(({theme}) => {
  const {color, space} = getThemeV2(theme)

  return css`
    display: grid;
    position: relative;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    padding: ${space[3]}px;
    word-break: break-all;
    align-items: center;

    * + & {
      border-block-start: 1px solid ${color.border};
    }

    .atom {
      display: flex;
      justify-content: space-between;
      gap: ${space[3]}px;
      align-items: center;
    }

    .primary-action {
      appearance: none;
      position: absolute;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      inset: 0;
      opacity: 0;
    }

    &:hover,
    &:focus-within {
      background-color: var(--card-muted-bg-color);
    }

    &:has(:checked) {
      background-color: ${color.focusRing};
    }
  `
})
