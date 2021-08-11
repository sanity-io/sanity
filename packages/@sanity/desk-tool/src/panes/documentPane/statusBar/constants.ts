import {ButtonTone} from '@sanity/ui'

export const MAX_SESSIONS = 3

export const LEGACY_BUTTON_COLOR_TO_TONE: Record<string, ButtonTone | undefined> = {
  primary: 'primary',
  warning: 'caution',
  success: 'positive',
  danger: 'critical',
}
