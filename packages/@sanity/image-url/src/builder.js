import urlForImage from './urlForImage'

const validFits = ['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']

class ImageUrlBuilder {
  constructor(parent, options) {
    if (parent) {
      this.options = Object.assign({}, parent.options, options || {})
    } else {
      this.options = options || {}
    }
  }

  _withOptions(options) {
    return new ImageUrlBuilder(this, options)
  }

  // The image to be represented. Accepts a Sanity 'image'-document, 'asset'-document or
  // _id of asset. To get the benefit of automatic hot-spot/crop integration with the content
  // studio, the 'image'-document must be provided.
  image(source) {
    return this._withOptions({source})
  }

  // Specify the dataset
  dataset(dataset) {
    return this._withOptions({dataset})
  }

  // Specify the projectId
  projectId(projectId) {
    return this._withOptions({projectId})
  }

  // Specify the width of the image in pixels
  width(width) {
    return this._withOptions({width})
  }

  // Specify the height of the image in pixels
  height(height) {
    return this._withOptions({height})
  }

  // Specify focal point in fraction of image dimensions. Each component 0.0-1.0
  focalPoint(x, y) {
    return this._withOptions({focalPoint: {x, y}})
  }

  maxWidth(maxWidth) {
    return this._withOptions({maxWidth})
  }

  minWidth(minWidth) {
    return this._withOptions({minWidth})
  }

  maxHeight(maxHeight) {
    return this._withOptions({maxHeight})
  }

  minHeight(minHeight) {
    return this._withOptions({minHeight})
  }

  // Specify width and height in pixels
  size(width, height) {
    return this._withOptions({width, height})
  }

  // Specify blur between 0 and 100
  blur(blur) {
    return this._withOptions({blur})
  }

  sharpen(sharpen) {
    return this._withOptions({sharpen})
  }

  // Specify the desired rectangle of the image
  rect(left, top, width, height) {
    return this._withOptions({rect: {left, top, width, height}})
  }

  // Specify the image format of the image. 'jpg', 'pjpg', 'png', 'webp'
  format(format) {
    return this._withOptions({format})
  }

  invert(invert) {
    return this._withOptions({invert})
  }

  // Rotation in degrees 0, 90, 180, 270
  orientation(orientation) {
    return this._withOptions({orientation})
  }

  // Compression quality 0-100
  quality(quality) {
    return this._withOptions({quality})
  }

  // Make it a download link. Parameter is default filename.
  forceDownload(download) {
    return this._withOptions({download})
  }

  // Flip image horizontally
  flipHorizontal() {
    return this._withOptions({flipHorizontal: true})
  }

  // Flip image verically
  flipVertical() {
    return this._withOptions({flipVertical: true})
  }

  // Ignore crop/hotspot from image record, even when present
  ignoreImageParams() {
    return this._withOptions({ignoreImageParams: true})
  }

  fit(value) {
    if (validFits.indexOf(value) === -1) {
      throw new Error(`Invalid fit mode "${value}"`)
    }

    return this._withOptions({fit: value})
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
  if (options && typeof options.clientConfig == 'object') {
    // Inherit config from client
    return new ImageUrlBuilder(null, {
      projectId: options.clientConfig.projectId,
      dataset: options.clientConfig.dataset,
    })
  }

  // Or just accept the options as given
  return new ImageUrlBuilder(null, options)
}
