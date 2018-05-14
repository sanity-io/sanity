// Convert an asset-id, asset or image to an image record suitable for processing
export default function parseSource(source) {
  if (!source) {
    return null
  }

  let image

  // Did we just get an asset id?
  if (typeof source === 'string') {
    image = {
      asset: {_ref: source}
    }
  } else if (typeof source._ref === 'string') {
    // We just got passed an asset directly
    image = {
      asset: source
    }
  } else if (source._id) {
    // If we were passed an image asset document
    image = {
      asset: {
        _ref: source._id
      }
    }
  } else if (typeof source.asset === 'object') {
    image = source
  } else {
    // We got something that does not look like an image, or it is an image
    // that currently isn't sporting an asset.
    return null
  }

  return applyDefaultHotspot(image)
}

// Mock crop and hotspot if image lacks it
function applyDefaultHotspot(image) {
  if (image.crop && image.hotspot) {
    return image
  }

  return Object.assign(
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
