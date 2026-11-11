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

    /*
     * A checked row (or set header) is filled with the focus ring colour. Everything on it takes
     * the inverse of the card colour, the way a selected menu item does: the text, the muted
     * secondary line, and the status icons. A badge keeps its shape but loses its tone: a tinted
     * fill would vanish into the blue, so it is outlined in the same colour instead.
     */
    &:has(:checked) {
      background-color: ${color.focusRing};
      color: ${color.bg};
      --card-fg-color: ${color.bg};
      --card-muted-fg-color: color-mix(in srgb, ${color.bg} 72%, transparent);

      /* The status icons set their tone colour inline on the svg, so only !important wins. */
      [data-testid='version-status'] svg {
        --card-icon-color: ${color.bg} !important;
        --icon-color: ${color.bg} !important;
        color: ${color.bg} !important;
      }

      [data-ui='Badge'] {
        background-color: transparent;
        box-shadow: inset 0 0 0 1px ${color.bg};
        color: ${color.bg};
        --card-fg-color: ${color.bg};
      }
    }
  `
})
