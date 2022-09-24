import type {CSSProperties} from 'react'
import {DEFAULT_HOTSPOT, DEFAULT_CROP} from './constants'
import {Crop, Hotspot, CropMethod, CropAndHotspot} from './types'

interface Options {
  image?: {aspectRatio: number} | {height: number; width: number}
  container?: {aspectRatio: number} | {height: number; width: number}
  hotspot?: Hotspot
  crop?: Crop
  align?: CropAlignment
}

interface CSSBox {
  width: number
  height: number
  left: number
  top: number
}

interface CropAlignment {
  x: 'left' | 'right' | 'center'
  y: 'top' | 'bottom' | 'center'
}

interface HotspotCropStyleResult {
  crop: CSSBox
  image: CSSBox
  method: CropMethod
}

export interface CalculatedStyles {
  container: CSSProperties
  padding: CSSProperties
  crop: CSSProperties
  image: CSSProperties
  debug: {
    result: HotspotCropStyleResult
  }
}

export function calculateStyles(options: Options = {}): CalculatedStyles {
  const imageAspect = readAspectRatio(options.image) || 1

  const hotspot = options.hotspot || DEFAULT_HOTSPOT
  const crop = options.crop || DEFAULT_CROP
  const containerAspect = readAspectRatio(options.container) || imageAspect * readCropAspect(crop)

  const align = options.align || {x: 'center', y: 'center'}

  const result = calculateHotSpotCrop(
    imageAspect,
    {hotspot, crop},
    {aspect: containerAspect, align}
  )

  const containerHeight = styleFormat(round(100 / containerAspect))

  return {
    debug: {
      result,
    },
    container: {
      //outline: '1px solid cyan',
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
      height: containerHeight,
    },
    padding: {
      marginTop: containerHeight,
    },
    crop: {
      position: 'absolute',
      overflow: 'hidden',
      height: toStylePercentage(result.crop.height),
      width: toStylePercentage(result.crop.width),
      top: toStylePercentage(result.crop.top),
      left: toStylePercentage(result.crop.left),
    },
    image: {
      position: 'absolute',
      height: toStylePercentage(result.image.height),
      width: toStylePercentage(result.image.width),
      top: toStylePercentage(result.image.top),
      left: toStylePercentage(result.image.left),
    },
  }
}

function readAspectRatio(opts: Options['image']): number | null {
  if (!opts) {
    return null
  }

  if ('aspectRatio' in opts) {
    return opts.aspectRatio
  }

  if ('height' in opts || 'width' in opts) {
    if (typeof opts.height !== 'number' && typeof opts.width !== 'number') {
      throw new Error(`Height and width must be numbers, got ${JSON.stringify(opts)}`)
    }

    return opts.width / opts.height
  }

  return null
}

function round(num: number, decimals = 2): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(num * multiplier) / multiplier
}

function calculateHotSpotCrop(
  sourceAspect: number,
  descriptor: CropAndHotspot,
  spec: {aspect: number; align: CropAlignment}
): HotspotCropStyleResult {
  const crop = descriptor.crop
  const viewportAspect = spec.aspect
  const alignment = spec.align

  // The rational aspect of the cropped image
  const netWidth = 1.0 - crop.left - crop.right
  const netHeight = 1.0 - crop.top - crop.bottom

  // Places the image inside the crop box
  const outImg = {
    top: -crop.top / netHeight,
    left: -crop.left / netWidth,
    width: 1 / netWidth,
    height: 1 / netHeight,
  }

  // The rational aspect is the aspect ration of the crop in ratios of the image size meaning the image
  // is always considered having the size 1.0*1.0
  const cropRationalAspect = netWidth / netHeight

  // cropAspect is the real aspect ratio of the crop box in pixel-space
  const cropAspect = cropRationalAspect * sourceAspect

  // Now we transform the hotspot to be expressed in ratios of the cropped area, not the
  // full image:
  const hotspot = {
    x: (descriptor.hotspot.x - crop.left) / netWidth,
    y: (descriptor.hotspot.y - crop.top) / netHeight,
    height: descriptor.hotspot.height / netHeight,
    width: descriptor.hotspot.width / netWidth,
  }

  // Lets calculate the maximum scale the image may be presented at without cropping the hotspot. A scale of
  // 1.0 means the cropped image exactly fill the width of the viewport.

  // The scale at which the hotspot would fill the viewport exactly in the X direction
  const maxHotspotXScale = 1.0 / hotspot.width
  // The scale at which the hotspot would fill the veiwport exactly in the Y direction
  const maxHotspotYScale = ((1.0 / hotspot.height) * cropAspect) / viewportAspect
  // This is the largest scale the image can have while still not cropping the hotspot:
  const maxScale = Math.min(maxHotspotXScale, maxHotspotYScale)

  // Now lets find the minimum scale we can have while maintaining full bleed (no letterboxing)
  let minFullBleedScale
  const cropIsTaller = cropAspect <= viewportAspect
  if (cropIsTaller) {
    // Crop is taller than viewport
    minFullBleedScale = 1.0 // By definition 1.0 fills the width of the viewport exactly with the viewport cutting away from the height of the cropbox
  } else {
    // Image is wider than viewport
    minFullBleedScale = cropAspect / viewportAspect // At this scale the viewport is filled exactly in the height while cutting away from the sides
  }

  let method: CropMethod
  let outCrop: CSSBox

  // Do we have to letterbox this image in order to leave the hotspot area uncropped?
  if (minFullBleedScale > maxScale) {
    // Yes :-( There is no way to protect the hot spot and still have full bleed, so we are letterboxing it
    method = 'letterbox'
    let letterboxScale
    const diff = minFullBleedScale - maxScale

    // Determine a scale where the image fills one dimension of the container
    if (cropIsTaller) {
      letterboxScale = 1.0 - diff
    } else {
      letterboxScale = maxScale
    }

    outCrop = {
      width: letterboxScale,
      height: (letterboxScale / cropAspect) * viewportAspect,

      // Gets overwritten further down
      left: 0,
      top: 0,
    }

    const hotspotLeft = hotspot.x * outCrop.width - (hotspot.width * outCrop.width) / 2
    switch (alignment.x) {
      case 'left':
        outCrop.left = cropIsTaller ? 0 : -hotspotLeft
        break
      case 'right':
        // todo: broken atm
        outCrop.left = cropIsTaller ? 1 - outCrop.width : hotspotLeft
        break
      case 'center':
        outCrop.left = cropIsTaller ? (1 - outCrop.width) / 2 : -hotspotLeft
        break
      default:
        throw new Error(
          `Invalid x alignment: '${alignment.x}'. Must be either 'left', 'right' or 'center'`
        )
    }
    const hotspotTop = hotspot.y * outCrop.height - (hotspot.height * outCrop.height) / 2
    switch (alignment.y) {
      case 'top':
        outCrop.top = cropIsTaller ? -hotspotTop : 0
        break
      case 'bottom':
        // todo: broken atm
        outCrop.top = hotspotTop
        break
      case 'center':
        outCrop.top = cropIsTaller ? -hotspotTop : (1 - outCrop.height) / 2
        break
      default:
        throw new Error(
          `Invalid y alignment: '${alignment.y}'. Must be either 'top', 'bottom' or 'center'`
        )
    }
  } else if (cropIsTaller) {
    // TODO: Clamp hotspot offset to avoid moving image off canvas
    method = 'full_width'

    let top = (-hotspot.y / cropAspect) * viewportAspect + 0.5
    const height = (minFullBleedScale / cropAspect) * viewportAspect
    // Clamp top so that we will not move the image off of the viewport
    if (top > 0) {
      top = 0
    } else if (-top > height - 1.0) {
      top = -(height - 1.0)
    }

    outCrop = {
      width: minFullBleedScale,
      height,
      left: 0,
      // Place the Y center of the hotspot near the center of the viewport
      top,
    }
  } else {
    // crop is wider
    method = 'full_height'

    const width = minFullBleedScale
    let left = 0.5 - hotspot.x * minFullBleedScale
    if (left > 0) {
      left = 0
    } else if (-left > width - 1.0) {
      left = -(width - 1.0)
    }
    // Clamp left so that we will not move the image off of the viewport.
    outCrop = {
      width,
      height: (minFullBleedScale / cropAspect) * viewportAspect,
      top: 0,
      // Place the X center of the hotspot at the center of the viewport
      left,
    }
  }

  return {
    method,
    crop: outCrop,
    image: outImg,
  }
}

function readCropAspect(crop: Crop) {
  const height = 1 - crop.top - crop.bottom
  const width = 1 - crop.left - crop.right
  return width / height
}

function styleFormat(num: number) {
  return num === 0 ? 0 : `${num}%`
}

function toStylePercentage(num: number) {
  return styleFormat(round(num * 100))
}
