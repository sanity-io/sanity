import type {ButtonTone, DialogProps, Placement} from '@sanity/ui'

export const POPOVER_FALLBACK_PLACEMENTS: Placement[] = ['left', 'bottom']

export const LEGACY_DIALOG_TO_UI_COLOR: {[key: string]: ButtonTone | undefined} = {
  info: 'primary',
  success: 'positive',
  danger: 'critical',
  warning: 'caution',
}

export const DIALOG_WIDTH_TO_UI_WIDTH: {[key: string]: DialogProps['width']} = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
}
