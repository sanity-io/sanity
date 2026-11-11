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

    /* The variant diamond before a row's name, in the variant colour like the menus' and the
       navbar chip's. A Default row keeps the width empty, so the names line up. */
    .variant-mark {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 1em;
      height: 1.5em;

      svg {
        --card-icon-color: var(--card-badge-suggest-icon-color);
        --icon-color: var(--card-badge-suggest-icon-color);
        color: var(--card-badge-suggest-icon-color);
      }
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
     * secondary line, and the variant diamond. A badge keeps its shape but loses its tone: a tinted
     * fill would vanish into the blue, so it is outlined in the same colour instead.
     */
    &:has(:checked) {
      background-color: ${color.focusRing};
      color: ${color.bg};
      --card-fg-color: ${color.bg};
      --card-muted-fg-color: color-mix(in srgb, ${color.bg} 72%, transparent);

      /* A ui5 Text reads its own --text-color, and the muted variant has its own rule. */
      [data-ui='Text'] {
        --text-color: ${color.bg};
        color: ${color.bg};
      }

      [data-ui='Text'][data-testid='version-secondary-line'] {
        color: color-mix(in srgb, ${color.bg} 72%, transparent);
      }

      .variant-mark svg {
        --card-icon-color: ${color.bg};
        --icon-color: ${color.bg};
        color: ${color.bg};
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
