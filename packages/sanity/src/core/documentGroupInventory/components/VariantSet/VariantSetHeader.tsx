import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {mixToContrast} from '../../utils/contrast'
import {SELECTION} from './selectionTokens'
import {MARK_COLUMN_WIDTH} from './VariantSet'
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

    /*
     * A header action is centred on the header itself, not on the name's trimmed text box, which
     * sat the button about 3px low. It ends 8px before the set's mark, and the name keeps clear of
     * it.
     */
    .header-actions {
      position: absolute;
      z-index: 1;
      inset-block-start: 50%;
      inset-inline-end: calc(var(--inventory-row-padding) + ${MARK_COLUMN_WIDTH}px + 8px);
      transform: translateY(-50%);
      /*
       * A flex box, so a button wrapped for its tooltip sits on no text line: in a block box the
       * wrapper's line added room above the button and pushed it 2px below the centre.
       */
      display: flex;
      align-items: center;
    }

    .variant-set-text:has(.header-actions) {
      padding-inline-end: 112px;
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
     * A set that exists only for the ghost row of a draft not created yet (a Draft set before the
     * first edit) is not there yet either: the ghost row's pale blue and dashed outline, and no
     * hover, since there is nothing in it to collapse onto or select.
     */
    &&&[data-pending] {
      background-color: ${SELECTION.checkedBackground};
      outline: 1px dashed ${SELECTION.openBackground};
      outline-offset: -2px;
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

    /* A header has no avatars, so its text also takes the presence column */
    .variant-set-text {
      grid-column: text-start / presence-end;
      min-inline-size: 0;
    }
  `
})
