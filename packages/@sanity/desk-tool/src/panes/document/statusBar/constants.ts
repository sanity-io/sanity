import type {ButtonTone} from '@sanity/ui'

export const LEGACY_BUTTON_COLOR_TO_TONE: Record<string, ButtonTone | undefined> = {
  primary: 'primary',
  warning: 'caution',
  success: 'positive',
  danger: 'critical',
}
