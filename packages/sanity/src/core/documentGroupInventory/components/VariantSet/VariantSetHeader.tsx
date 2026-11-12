import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {mixToContrast} from '../../utils/contrast'
import {VariantSetEntry} from './VariantSetEntry'

/**
 * A set's header row. Its checkbox sits in the same column as the rows' checkboxes, and its icon in
 * the shared leading column with the rows' marks, so the icon is never covered or swapped out.
 */
export const VariantSetHeader = styled(VariantSetEntry)(({theme}) => {
  const {color} = getThemeV2(theme)

  return css`
    position: sticky;
    inset-block-start: 0;
    z-index: 2;
    background-color: var(--card-muted-bg-color);

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
