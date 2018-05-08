import urlForImage from './urlForImage'

const validFits = ['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']
const validCrops = ['top', 'bottom', 'left', 'right', 'center', 'focalpoint', 'entropy']

class ImageUrlBuilder {
  constructor(parent, options) {
    if (parent) {
      this.options = Object.assign({}, parent.options, options || {})
    } else {
      this.options = options || {}
    }
  }

  withOptions(options) {
    return new ImageUrlBuilder(this, options)
  }

  // The image to be represented. Accepts a Sanity 'image'-document, 'asset'-document or
  // _id of asset. To get the benefit of automatic hot-spot/crop integration with the content
  // studio, the 'image'-document must be provided.
  image(source) {
    return this.withOptions({source})
  }

  // Specify the dataset
  dataset(dataset) {
    return this.withOptions({dataset})
  }

  // Specify the projectId
  projectId(projectId) {
    return this.withOptions({projectId})
  }

  // Specify the width of the image in pixels
  width(width) {
    return this.withOptions({width})
  }

  // Specify the height of the image in pixels
  height(height) {
    return this.withOptions({height})
  }

  // Specify focal point in fraction of image dimensions. Each component 0.0-1.0
  focalPoint(x, y) {
    return this.withOptions({focalPoint: {x, y}})
  }

  maxWidth(maxWidth) {
    return this.withOptions({maxWidth})
  }

  minWidth(minWidth) {
    return this.withOptions({minWidth})
  }

  maxHeight(maxHeight) {
    return this.withOptions({maxHeight})
  }

  minHeight(minHeight) {
    return this.withOptions({minHeight})
  }

  // Specify width and height in pixels
  size(width, height) {
    return this.withOptions({width, height})
  }

  // Specify blur between 0 and 100
  blur(blur) {
    return this.withOptions({blur})
  }

  sharpen(sharpen) {
    return this.withOptions({sharpen})
  }

  // Specify the desired rectangle of the image
  rect(left, top, width, height) {
    return this.withOptions({rect: {left, top, width, height}})
  }

  // Specify the image format of the image. 'jpg', 'pjpg', 'png', 'webp'
  format(format) {
    return this.withOptions({format})
  }

  invert(invert) {
    return this.withOptions({invert})
  }

  // Rotation in degrees 0, 90, 180, 270
  orientation(orientation) {
    return this.withOptions({orientation})
  }

  // Compression quality 0-100
  quality(quality) {
    return this.withOptions({quality})
  }

  // Make it a download link. Parameter is default filename.
  forceDownload(download) {
    return this.withOptions({download})
  }

  // Flip image horizontally
  flipHorizontal() {
    return this.withOptions({flipHorizontal: true})
  }

  // Flip image verically
  flipVertical() {
    return this.withOptions({flipVertical: true})
  }

  // Ignore crop/hotspot from image record, even when present
  ignoreImageParams() {
    return this.withOptions({ignoreImageParams: true})
  }

  fit(value) {
    if (validFits.indexOf(value) === -1) {
      throw new Error(`Invalid fit mode "${value}"`)
    }

    return this.withOptions({fit: value})
  }

  crop(value) {
    if (validCrops.indexOf(value) === -1) {
      throw new Error(`Invalid crop mode "${value}"`)
    }

    return this.withOptions({crop: value})
  }

  // Gets the url based on the submitted parameters
  url() {
    return urlForImage(this.options)
  }

  // Synonym for url()
  toString() {
    return this.url()
  }
}

export default function urlBuilder(options) {
  // Did we get a SanityClient?
  if (options && typeof options.clientConfig === 'object') {
    // Inherit config from client
    return new ImageUrlBuilder(null, {
      baseUrl: options.clientConfig.apiHost.replace(/^https:\/\/api\./, 'https://cdn.'),
      projectId: options.clientConfig.projectId,
      dataset: options.clientConfig.dataset
    })
  }

  // Or just accept the options as given
  return new ImageUrlBuilder(null, options)
}
