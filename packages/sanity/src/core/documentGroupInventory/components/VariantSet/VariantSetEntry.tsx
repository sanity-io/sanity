import {Card} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {mixToContrast} from '../../utils/contrast'
import {selectionColors} from './selectionColors'
import {LEADING_COLUMN_WIDTH} from './VariantSet'

/** The contrast of a resting checkbox's border against the row: the 3:1 minimum for a control. */
const CHECKBOX_REST_CONTRAST = 3

/**
 * A row of a set (and, through VariantSetHeader, its header). It is a Card so the row of the version
 * open in the form takes Studio's selected state the way the document list's selected item does:
 * `selected` with `data-as="button"` switches it to the theme's selected palette, which sets the
 * background, the text colours and the badge icon colours the status marks paint with.
 */
export const VariantSetEntry = styled(Card)(({theme}) => {
  const {color, space} = getThemeV2(theme)
  const selected = selectionColors(color)

  return css`
    /* Over the Card's own display, as on the set */
    display: grid !important;
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
     * Quiet at rest: an empty checkbox's border is the quietest colour that still reaches the 3:1
     * WCAG asks of a control's boundary, so the column reads as a rail. It goes to full contrast
     * while its row is hovered or holds focus. A checked or partly checked box keeps Sanity UI's
     * filled style, a blocked one its read-only style, and a focused one Sanity UI's focus ring.
     */
    .selection-checkbox {
      display: flex;
      --selection-checkbox-border: ${mixToContrast(color.fg, color.bg, CHECKBOX_REST_CONTRAST)};
    }

    &:hover .selection-checkbox,
    &:focus-within .selection-checkbox {
      --selection-checkbox-border: ${color.fg};
    }

    .selection-checkbox
      input:not(:checked, :indeterminate, :disabled, [data-read-only], :focus-visible)
      + span {
      box-shadow: inset 0 0 0 1px var(--selection-checkbox-border);
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
     * The row's tab stop is its invisible primary action, so its focus ring is drawn on the row.
     */
    &:has(.primary-action:focus-visible) {
      outline: 2px solid ${color.focusRing};
      outline-offset: -2px;
    }

    /*
     * A checked row takes a light tint of the selection colour, so its text keeps its own colours
     * and contrast. The tint is mixed from theme colours, so it holds in light and dark. A group
     * header tints its own band instead, in VariantSetHeader.
     */
    &:has(.atom :checked) {
      background-color: ${selected.row};
    }

    /*
     * The row of the version open in the form: Studio's selected state, as in the document list.
     * Its background wins over the hover and checked tints, and its text takes the selected
     * palette's colours, which a ui5 Text does not follow by itself. The checkbox border follows
     * the selected text colour, so an empty box stays visible on the selected background.
     */
    &&&[data-selected] {
      background-color: var(--card-bg-color);
    }

    &[data-selected] [data-testid='version-title'] {
      color: var(--card-fg-color);
    }

    &[data-selected] [data-testid='version-secondary-line'] {
      color: var(--card-muted-fg-color);
    }

    &[data-selected] .selection-checkbox {
      --selection-checkbox-border: var(--card-fg-color);
    }

    /*
     * A checked or partly checked box keeps its fill, ringed in the selected text colour: in dark
     * the light fill alone sits too close to the selected background. Keyboard focus keeps Sanity
     * UI's focus ring.
     */
    &[data-selected]
      .selection-checkbox
      input:is(:checked, :indeterminate):not(:focus-visible)
      + span {
      box-shadow: 0 0 0 1px var(--card-fg-color);
    }
  `
})
