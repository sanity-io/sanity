import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {mixToContrast} from '../../utils/contrast'
import {SELECTION} from './selectionTokens'
import {VariantSetEntry} from './VariantSetEntry'

/**
 * A set's header row. Its checkbox sits in the same column as the rows' checkboxes, and its icon in
 * the trailing column with the rows' marks. The header is also the group's collapse toggle.
 */
export const VariantSetHeader = styled(VariantSetEntry)(({theme}) => {
  const {color} = getThemeV2(theme)

  return css`
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    background-color: var(--card-muted-bg-color);

    /*
     * The whole header is the group's collapse toggle: an invisible button over it, under the
     * checkbox and any header actions. It reads as pressable on hover. A collapsed group that holds
     * the open version keeps a pale blue band (UI 5's low-emphasis selection), so the open version
     * can still be found.
     */
    .group-toggle {
      appearance: none;
      position: absolute;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    .header-actions {
      position: relative;
      z-index: 1;
    }

    /* Focus shows as the header's focus ring, not as a row's focus tint */
    &:focus-within {
      background-color: var(--card-muted-bg-color);
    }

    &[data-open-inside] {
      background-color: ${SELECTION.checkedBackground};
    }

    &:hover {
      background-color: ${SELECTION.headerHoverBackground};
    }

    /*
     * A checked header stays a band of its own, one step stronger on the blue ladder than its
     * checked rows, so it still reads as the group's header when the whole group is checked.
     */
    &:has(.atom :checked) {
      background-color: ${SELECTION.checkedHeaderBackground};
    }

    /* The resting checkbox border reaches 3:1 against the header's own, muted, background. */
    .selection-checkbox {
      --selection-checkbox-border: ${mixToContrast(color.fg, color.muted.bg, 3)};
    }

    .variant-set-icon {
      display: flex;
      grid-column: mark;
      align-items: center;
      justify-content: center;
    }

    .variant-set-text {
      grid-column: text;
      min-inline-size: 0;
    }
  `
})
