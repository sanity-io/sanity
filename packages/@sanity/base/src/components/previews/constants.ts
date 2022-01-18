import {GeneralPreviewLayoutKey, PortableTextPreviewLayoutKey} from './types'

type LayoutKey = Exclude<GeneralPreviewLayoutKey, 'card'> | PortableTextPreviewLayoutKey

export const PREVIEW_MEDIA_SIZE: Record<LayoutKey, {width: number; height: number}> = {
  block: {width: 33, height: 33},
  blockImage: {width: 600, height: 400},
  default: {width: 35, height: 35},
  detail: {width: 75, height: 75},
  inline: {width: 15, height: 15},
  media: {width: 160, height: 160},
}

export const PREVIEW_ICON_SIZE: Record<LayoutKey, number | undefined> = {
  block: 31,
  blockImage: 45,
  default: 33,
  detail: 45,
  inline: 15,
  media: 45,
}
