import {PreviewLayoutKey} from './types'

export const PREVIEW_SIZES: Record<
  PreviewLayoutKey,
  {
    icon: number
    media: {height: number; width: number}
  }
> = {
  block: {
    icon: 25,
    media: {width: 33, height: 33},
  },
  blockImage: {
    icon: 25,
    media: {width: 600, height: 400},
  },
  compact: {
    icon: 21,
    media: {width: 25, height: 25},
  },
  default: {
    icon: 21,
    media: {width: 33, height: 33},
  },
  detail: {
    icon: 25,
    media: {width: 73, height: 73},
  },
  inline: {
    icon: 15,
    media: {width: 15, height: 15},
  },
  media: {
    icon: 25,
    media: {width: 160, height: 160},
  },
}
