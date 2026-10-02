import {type Placement} from '@sanity/ui'

import {type DialogProps} from '../../../../../ui-components/dialog/Dialog'

export const POPOVER_FALLBACK_PLACEMENTS_BOTTOM_BAR: Placement[] = ['left', 'bottom']
export const POPOVER_FALLBACK_PLACEMENTS_TOP_BAR: Placement[] = ['left', 'top']

export const DIALOG_WIDTH_TO_UI_WIDTH: {[key: string]: DialogProps['width']} = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
}
