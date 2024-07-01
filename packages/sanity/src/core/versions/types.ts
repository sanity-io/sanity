import {type IconSymbol} from '@sanity/icons'
import {type ButtonTone} from '@sanity/ui'

/**
 * @beta
 * @hidden
 */
export interface Version {
  name: string
  title: string
  icon: IconSymbol | undefined
  tone: ButtonTone | undefined
  publishAt: Date | number | undefined
}

export interface Bundle {
  name: string
  title: string
  description?: string
  tone?: ButtonTone | undefined
  publishAt?: string
}

export interface SanityVersionIcon {
  tone: ButtonTone
  icon: IconSymbol
}
