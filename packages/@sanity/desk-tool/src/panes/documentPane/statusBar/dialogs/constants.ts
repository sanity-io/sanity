import {ButtonTone, Placement} from '@sanity/ui'

export const POPOVER_FALLBACK_PLACEMENTS: Placement[] = ['top', 'bottom']

export const LEGACY_DIALOG_TO_UI_COLOR: {[key: string]: ButtonTone | undefined} = {
  info: 'primary',
  success: 'positive',
  danger: 'critical',
  warning: 'caution',
}
