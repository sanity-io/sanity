import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {LEADING_COLUMN_WIDTH} from './VariantSet'

export const VariantSetEntry = styled.div(({theme}) => {
  const {color, space} = getThemeV2(theme)

  return css`
    display: grid;
    position: relative;
    grid-column: row-start / row-end;
    grid-template-columns: subgrid;
    /* The inline padding is the set grid's edge tracks, so a subgrid's own would shrink them. */
    padding-block: ${space[3]}px;
    align-items: center;

    * + & {
      border-block-start: 1px solid ${color.border};
    }

    /*
     * The text column keeps at least 140px with the mark column and its gap, the same minimum as
     * before the mark moved into the shared leading column.
     */
    --version-text-min: 140px;
    --version-lines-min: calc(
      var(--version-text-min) - ${LEADING_COLUMN_WIDTH}px - var(--inventory-leading-gap)
    );

    /* The selection checkbox, at the far left of every row and every group header. */
    .atom {
      display: flex;
      position: relative;
      z-index: 1;
      grid-column: check;
      align-items: center;
      justify-content: center;
    }

    /*
     * Quiet at rest: an empty checkbox is a muted outline, so the column reads as a rail. It goes to
     * full contrast while its row is hovered or holds focus, and once checked or partly checked.
     * A blocked checkbox stays muted.
     */
    .selection-checkbox {
      display: flex;
      opacity: 0.4;
      transition: opacity 100ms ease-out;
    }

    &:hover .selection-checkbox:not([data-blocked]),
    &:focus-within .selection-checkbox:not([data-blocked]),
    .selection-checkbox:not([data-blocked]):has(:checked, :indeterminate) {
      opacity: 1;
    }

    .selection-checkbox[data-blocked] input {
      cursor: not-allowed;
    }

    /* The checkbox's hit area reaches into the row's padding, but not over the mark. */
    .selection-checkbox input::before {
      display: block;
      position: absolute;
      content: '';
      inset-block: -${space[3]}px;
      inset-inline: -${space[3]}px -${space[1]}px;
    }

    /*
     * The shared leading column, holding the variant diamond. A Default row has no mark: the column
     * stays empty, so every name and every second line start at the same x as the group's name. The
     * diamond is centred on the whole row.
     */
    .variant-mark {
      display: flex;
      grid-column: mark;
      align-items: center;
      align-self: stretch;
      justify-content: center;

      /* The variant colour, like the menus' and the navbar chip's diamond. */
      svg {
        --card-icon-color: var(--card-badge-suggest-icon-color);
        --icon-color: var(--card-badge-suggest-icon-color);
        color: var(--card-badge-suggest-icon-color);
      }
    }

    /*
     * The text column. It must be allowed to shrink below its content, or a long name would widen
     * the row instead of ending in an ellipsis.
     */
    .row-content {
      grid-column: text;
      min-inline-size: 0;
    }

    /*
     * The text and the badge group wrap as two items. The text column keeps at least 140px with the
     * mark column; when that and the group do not fit on one line, the group moves whole to the next line, where it starts at
     * the body's left edge, which is the text's left edge. The wrap point follows the inventory
     * panel's own width and the badges' real width, not the viewport.
     */
    .version-body {
      display: flex;
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
