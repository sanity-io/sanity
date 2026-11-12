import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {inventoryContainerName} from '../CreateVariant/CreateVariant.css'

export const VariantSetEntry = styled.div(({theme}) => {
  const {color, space} = getThemeV2(theme)

  return css`
    display: grid;
    position: relative;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    padding: ${space[3]}px;
    align-items: center;

    * + & {
      border-block-start: 1px solid ${color.border};
    }

    .atom {
      display: flex;
      align-items: center;
    }

    /*
     * The second grid column. It must be allowed to shrink below its content, or a long name would
     * widen the row instead of ending in an ellipsis.
     */
    .row-content {
      min-inline-size: 0;
    }

    /*
     * A 25px column for the variant diamond, the width of the leading slot of the document list's
     * versions flyout, then the body. The diamond is centred on the whole block. A Default row
     * keeps the empty column, so every name and every second line start at the same place.
     */
    .version-text {
      --variant-mark-column: 25px;
      --variant-mark-gap: ${space[2]}px;
      /* The text column, the diamond included, is never narrower than 140px. */
      --version-text-min: 140px;
      --version-lines-min: calc(
        var(--version-text-min) - var(--variant-mark-column) - var(--variant-mark-gap)
      );

      display: grid;
      grid-template-columns: var(--variant-mark-column) minmax(0, 1fr);
      column-gap: var(--variant-mark-gap);
      align-items: center;
    }

    .variant-mark {
      display: flex;
      grid-column: 1;
      align-items: center;
      align-self: stretch;
      justify-content: center;
      width: var(--variant-mark-column);

      /* The variant colour, like the menus' and the navbar chip's diamond. */
      svg {
        --card-icon-color: var(--card-badge-suggest-icon-color);
        --icon-color: var(--card-badge-suggest-icon-color);
        color: var(--card-badge-suggest-icon-color);
      }
    }

    /*
     * The text and the badge group wrap as two items. The text column keeps at least 140px with the
     * diamond's slot; when that and the group do not fit on one line, the group moves whole to the next line, where it starts at
     * the body's left edge, which is the text's left edge. The wrap point follows the inventory
     * panel's own width and the badges' real width, not the viewport.
     */
    .version-body {
      display: flex;
      grid-column: 2;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: ${space[2]}px ${space[3]}px;
      min-inline-size: 0;
    }

    .version-lines {
      display: grid;
      flex: 1 1 var(--version-lines-min);
      row-gap: ${space[2]}px;
      min-inline-size: var(--version-lines-min);
    }

    /*
     * One line each, ending in an ellipsis. A name is never broken inside a word. The clip is on
     * the block wrapper, since a ui5 Text can be an inline span, and only on the inline axis, so
     * the trimmed text keeps its descenders.
     */
    .version-title,
    .version-secondary,
    .version-secondary [data-ui='Text'] {
      min-inline-size: 0;
      overflow-x: clip;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .version-badges {
      display: flex;
      flex: 0 0 auto;
      flex-wrap: nowrap;
      gap: ${space[1]}px;
      align-items: center;
    }

    /*
     * Below this the row's own padding would leave the text column less than its 140px, so the row
     * gives up some of its padding before the text gives up any width.
     */
    @container ${inventoryContainerName} (width < 240px) {
      padding-inline: ${space[2]}px;
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
