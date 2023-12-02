import {Placement} from '@sanity/ui'
import {DialogProps} from '../../../../../ui'

export const POPOVER_FALLBACK_PLACEMENTS: Placement[] = ['left', 'bottom']

export const DIALOG_WIDTH_TO_UI_WIDTH: {[key: string]: DialogProps['width']} = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
}
