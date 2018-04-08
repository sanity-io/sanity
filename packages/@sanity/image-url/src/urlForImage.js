const SPEC_NAME_TO_URL_NAME_MAPPINGS = [
  ['width', 'w'],
  ['height', 'h'],
  ['format', 'fm'],
  ['download', 'dl'],
  ['blur', 'blur'],
  ['sharpen', 'sharp'],
  ['invert', 'invert'],
  ['orientation', 'or'],
  ['minHeight', 'min-h'],
  ['maxHeight', 'max-h'],
  ['minWidth', 'min-w'],
  ['maxWidth', 'max-w'],
  ['quality', 'q'],
  ['fit', 'fit'],
  ['crop', 'crop']
]

export default function urlForImage(options) {
  let spec = Object.assign({}, options || {})
  const source = spec.source
  delete spec.source

  const image = parseSource(source)
  if (!image) {
    return null
  }

  const asset = parseAssetId(image.asset._ref)

  // Compute crop rect in terms of pixel coordinates in the raw source image
  const crop = {
    left: Math.round(image.crop.left * asset.width),
    top: Math.round(image.crop.top * asset.height)
  }

  crop.width = Math.round(asset.width - image.crop.right * asset.width - crop.left)
  crop.height = Math.round(asset.height - image.crop.bottom * asset.height - crop.top)

  // Compute hot spot rect in terms of pixel coordinates
  const hotSpotVerticalRadius = image.hotspot.height * asset.height / 2
  const hotSpotHorizontalRadius = image.hotspot.width * asset.width / 2
  const hotSpotCenterX = image.hotspot.x * asset.width
  const hotSpotCenterY = image.hotspot.y * asset.height
  const hotspot = {
    left: hotSpotCenterX - hotSpotHorizontalRadius,
    top: hotSpotCenterY - hotSpotVerticalRadius,
    right: hotSpotCenterX + hotSpotHorizontalRadius,
    bottom: hotSpotCenterY + hotSpotHorizontalRadius
  }

  spec.asset = asset

  // If irrelevant, or if we are requested to: don't perform crop/fit based on
  // the crop/hotspot.
  if (!(spec.rect || spec.focalPoint || spec.ignoreImageParams || spec.crop)) {
    spec = Object.assign(spec, fit({crop, hotspot}, spec))
  }

  return specToImageUrl(spec)
}

// Convert an asset-id, asset or image to an image record suitable for processing
export function parseSource(source) {
  let image

  // Did we just get an asset id?
  if (typeof source === 'string') {
    image = {
      asset: {_ref: source}
    }
  } else if (
    source._type === 'sanity.imageAsset' ||
    (typeof source === 'object' && typeof source._ref === 'string')
  ) {
    // We just got passed an asset directly
    image = {
      asset: source
    }
  } else if (typeof source === 'object' && typeof source.asset === 'object') {
    image = source
  } else {
    // We got something that does not look like an image, or it is an image
    // that currently isn't sporting an asset.
    return null
  }

  if (!image.crop || !image.hotspot) {
    // Mock crop and hotspot if image lacks it
    image = Object.assign(
      {
        crop: {
          left: 0,
          top: 0,
          bottom: 0,
          right: 0
        },
        hotspot: {
          x: 0.5,
          y: 0.5,
          height: 1.0,
          width: 1.0
        }
      },
      image
    )
  }

  return image
}

function parseAssetId(ref) {
  const [, id, dimensionString, format] = ref.split('-')

  if (!(typeof dimensionString == 'string')) {
    throw new Error(
      `Malformed asset _ref '${ref}'. Expected an id on the form "image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg.`
    )
  }

  const [imgWidthStr, imgHeightStr] = dimensionString.split('x')

  const width = +imgWidthStr
  const height = +imgHeightStr

  if (
    !(
      typeof id == 'string' &&
      typeof format == 'string' &&
      Number.isFinite(width) &&
      Number.isFinite(height)
    )
  ) {
    throw new Error(
      `Malformed asset _ref '${ref}'. Expected an id on the form "image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg.`
    )
  }

  return {id, width, height, format}
}

/* eslint-disable complexity */
function specToImageUrl(spec) {
  const cdnUrl = spec.baseUrl || 'https://cdn.sanity.io'
  const filename = `${spec.asset.id}-${spec.asset.width}x${spec.asset.height}.${spec.asset.format}`
  const baseUrl = `${cdnUrl}/images/${spec.projectId}/${spec.dataset}/${filename}`

  const params = []

  if (spec.rect) {
    // Only bother url with a crop if it actually crops anything
    const isEffectiveCrop =
      spec.rect.left != 0 ||
      spec.rect.top != 0 ||
      spec.rect.height != spec.asset.height ||
      spec.rect.width != spec.asset.width
    if (isEffectiveCrop) {
      params.push(`rect=${spec.rect.left},${spec.rect.top},${spec.rect.width},${spec.rect.height}`)
    }
  }

  if (spec.focalPoint) {
    params.push(`fp-x=${spec.focalPoint.x}`)
    params.push(`fp-x=${spec.focalPoint.y}`)
  }

  if (spec.flipHorizontal || spec.flipVertical) {
    params.push(`flip=${spec.flipHorizontal ? 'h' : ''}${spec.flipVertical ? 'v' : ''}`)
  }

  // Map from spec name to url param name
  SPEC_NAME_TO_URL_NAME_MAPPINGS.forEach(mapping => {
    const [specName, param] = mapping
    if (typeof spec[specName] != 'undefined') {
      params.push(`${param}=${encodeURIComponent(spec[specName])}`)
    }
  })

  if (params.length == 0) {
    return baseUrl
  }

  return `${baseUrl}?${params.join('&')}`
}
/* eslint-enable complexity */

function fit(source, spec) {
  const result = {
    width: spec.width,
    height: spec.height
  }

  // If we are not constraining the aspect ratio, we'll just use the whole crop
  if (!(spec.width && spec.height)) {
    result.rect = source.crop
    return result
  }

  const crop = source.crop
  const hotspot = source.hotspot

  // If we are here, that means aspect ratio is locked and fitting will be a bit harder
  const desiredAspectRatio = spec.width / spec.height
  const cropAspectRatio = crop.width / crop.height

  if (cropAspectRatio > desiredAspectRatio) {
    // The crop is wider than the desired aspect ratio. That means we are cutting from the sides
    const height = crop.height
    const width = height * desiredAspectRatio
    const top = crop.top
    // Center output horizontally over hotspot
    const hotspotXCenter = (hotspot.right - hotspot.left) / 2 + hotspot.left
    let left = hotspotXCenter - width / 2
    // Keep output within crop
    if (left < crop.left) {
      left = crop.left
    } else if (left + width > crop.left + crop.width) {
      left = crop.left + crop.width - width
    }
    result.rect = {
      left: Math.round(left),
      top: Math.round(top),
      width: Math.round(width),
      height: Math.round(height)
    }
    return result
  }
  // The crop is taller than the desired ratio, we are cutting from top and bottom
  const width = crop.width
  const height = width / desiredAspectRatio
  const left = crop.left
  // Center output vertically over hotspot
  const hotspotYCenter = (hotspot.bottom - hotspot.top) / 2 + hotspot.top
  let top = hotspotYCenter - height / 2
  // Keep output rect within crop
  if (top < crop.top) {
    top = crop.top
  } else if (top + height > crop.top + crop.height) {
    top = crop.top + crop.height - height
  }
  result.rect = {
    left: Math.floor(left),
    top: Math.floor(top),
    width: Math.round(width),
    height: Math.round(height)
  }
  return result
}
