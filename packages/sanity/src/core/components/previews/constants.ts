import {PreviewLayoutKey} from './types'

export const PREVIEW_SIZES: Record<
  PreviewLayoutKey,
  {
    icon: number
    media: {height: number; width: number}
  }
> = {
  block: {
    icon: 31,
    media: {width: 33, height: 33},
  },
  blockImage: {
    icon: 45,
    media: {width: 600, height: 400},
  },
  compact: {
    icon: 21,
    media: {width: 25, height: 25},
  },
  default: {
    icon: 25,
    media: {width: 39, height: 39},
  },
  detail: {
    icon: 45,
    media: {width: 70, height: 70},
  },
  inline: {
    icon: 15,
    media: {width: 15, height: 15},
  },
  media: {
    icon: 45,
    media: {width: 160, height: 160},
  },
}
