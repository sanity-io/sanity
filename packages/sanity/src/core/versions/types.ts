import {type ColorHueKey} from '@sanity/color'
import {type IconSymbol} from '@sanity/icons'

export interface Version {
  name: string
  title: string
  icon: IconSymbol | undefined
  hue: ColorHueKey | undefined
  publishAt: Date | number
}
