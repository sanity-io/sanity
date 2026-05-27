import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

export const VariantSetEntry = styled.div(({theme}) => {
  const {color, space} = getThemeV2(theme)

  return css`
    position: relative;
    padding: ${space[3]}px;
    word-break: break-all;
    justify-content: space-between;

    * + & {
      border-block-start: 1px solid ${color.border};
    }

    &,
    .atom {
      display: flex;
      gap: ${space[3]}px;
      align-items: center;
    }

    .inert {
      pointer-events: none;
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
