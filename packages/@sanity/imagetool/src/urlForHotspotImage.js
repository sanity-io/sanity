// Takes a Sanity image and display options and generates an image url
// options on the form {projectId: "<projectId>", dataset: "<datasetName>", width: 100}
// Specify width, height or both.
export default function urlForImage(image, options) {
  const spec = options || {}

  // Is there even an asset here?
  if (!image.asset) {
    return null
  }

  const asset = parseAssetId(image.asset._ref)
  if (!image.crop || !image.hotspot) {
    // Mock crop and hostpot if image lacks it
    image = Object.assign({
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
    }, image)
  }

  // Compute crop rect in terms of pixel coordinates in the raw source image
  const crop =  {
    left: image.crop.left * asset.width,
    top: image.crop.top * asset.height,
    right: asset.width - image.crop.right * asset.width,
    bottom: asset.height - image.crop.bottom * asset.height,
  }

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

  return optionsToImageUrl(fit({asset, crop, hotspot}, spec))
}

function parseAssetId(ref) {
  const [, id, dimensionString, format] = ref.split('-')
  const [imgWidthStr, imgHeightStr] = dimensionString.split('x')

  const width = +imgWidthStr
  const height = +imgHeightStr

  if (!(typeof id == 'string' && typeof format == 'string' && Number.isFinite(width) && Number.isFinite(height))) {
    throw new Error(`Malformed asset _ref '${ref}'. Expected an id on the form "image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg.`)
  }

  return {id, width, height, format}
}

function optionsToImageUrl(opts) {
  const baseUrl = `https://cdn.sanity.io/images/${opts.projectId}/${opts.dataset}/${opts.asset.id}-${opts.asset.width}x${opts.asset.height}.${opts.format || opts.asset.format}`
  const params = []
  if (opts.rect) {
    // Only bother url with a crop if it actually crops anything
    const isEffectiveCrop = opts.rect.left != 0 || opts.rect.top != 0 || opts.rect.bottom != opts.asset.height || opts.rect.right != opts.asset.width
    if (isEffectiveCrop) {
      params.push(`rect=${opts.rect.left},${opts.rect.top},${opts.rect.right - opts.rect.left},${opts.rect.bottom - opts.rect.top}`)
    }
  }
  if (opts.width) {
    params.push(`w=${opts.width}`)
  }
  if (opts.height) {
    params.push(`h=${opts.height}`)
  }
  if (params.length == 0) {
    return baseUrl
  }
  return `${baseUrl}?${params.join('&')}`
}

function fit(source, spec) {
  const result = {
    projectId: spec.projectId,
    dataset: spec.dataset,
    width: spec.width,
    height: spec.height,
    asset: source.asset
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
  const cropAspectRatio = (crop.right - crop.left) / (crop.bottom - crop.top)


  if (cropAspectRatio > desiredAspectRatio) {
    // The crop is wider than the desired aspect ratio. That means we are cutting from the sides
    const height = crop.bottom - crop.top
    const width = height * desiredAspectRatio
    const top = crop.top
    // Center output horizontally over hotspot
    const hotspotXCenter = (hotspot.right - hotspot.left) / 2 + hotspot.left
    let left = hotspotXCenter - width / 2
    // Keep output within crop
    if (left < crop.left) {
      left = crop.left
    } else if (left + width > crop.right) {
      left = crop.right - width
    }
    result.rect = {
      left: Math.round(left),
      top: Math.round(top),
      right: Math.round(left + width),
      bottom: Math.round(top + height)
    }
    return result
  } else {
    // The crop is taller than the desired ratio, we are cutting from top and bottom
    const width = crop.right - crop.left
    const height = width / desiredAspectRatio
    const left = crop.left
    // Center output vertically over hotspot
    const hotspotYCenter = (hotspot.bottom - hotspot.top) / 2 + hotspot.top
    let top = hotspotYCenter - height / 2
    // Keep output rect wifhin crop
    if (top < crop.top) {
      top = crop.top
    } else if (top + height > crop.bottom) {
      top = crop.bottom - height
    }
    result.rect = {
      left: Math.floor(left),
      top: Math.floor(top),
      right: Math.round(left + width),
      bottom: Math.round(top + height)
    }
    return result
  }
}