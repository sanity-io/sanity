const assign = require('object-assign')
const {map} = require('@sanity/observable/operators/map')
const {filter} = require('@sanity/observable/operators/filter')
const queryString = require('../http/queryString')
const validators = require('../validators')

function AssetsClient(client) {
  this.client = client
}

function toDocument(body) {
  // todo: rewrite to just return body.document in a while
  const document = body.document
  Object.defineProperty(document, 'document', {
    enumerable: false,
    get: () => {
      // eslint-disable-next-line no-console
      console.warn(
        'The promise returned from client.asset.upload(...) now resolves with the asset document'
      )
      return document
    },
  })
  return document
}

function optionsFromFile(opts, file) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return opts
  }

  return assign(
    {
      filename: opts.preserveFilename === false ? undefined : file.name,
      contentType: file.type,
    },
    opts
  )
}

assign(AssetsClient.prototype, {
  /**
   * Upload an asset
   *
   * @param  {String} assetType `image` or `file`
   * @param  {File|Blob|Buffer|ReadableStream} body File to upload
   * @param  {Object}  opts Options for the upload
   * @param  {Boolean} opts.preserveFilename Whether or not to preserve the original filename (default: true)
   * @param  {String}  opts.filename Filename for this file (optional)
   * @param  {Number}  opts.timeout  Milliseconds to wait before timing the request out (default: 0)
   * @param  {String}  opts.contentType Mime type of the file
   * @param  {Array}   opts.extract Array of metadata parts to extract from image.
   *                                 Possible values: `location`, `exif`, `image`, `palette`
   * @param  {String}  opts.label Label
   * @param  {String}  opts.title Title
   * @param  {String}  opts.description Description
   * @param  {String}  opts.creditLine The credit to person(s) and/or organization(s) required by the supplier of the image to be used when published
   * @param  {Object}  opts.source Source data (when the asset is from an external service)
   * @param  {String}  opts.source.id The (u)id of the asset within the source, i.e. 'i-f323r1E'
   *                                  Required if source is defined
   * @param  {String}  opts.source.name The name of the source, i.e. 'unsplash'
   *                                  Required if source is defined
   * @param  {String}  opts.source.url A url to where to find the asset, or get more info about it in the source
   *                                  Optional
   * @return {Promise} Resolves with the created asset document
   */
  upload(assetType, body, opts = {}) {
    validators.validateAssetType(assetType)

    // If an empty array is given, explicitly set `none` to override API defaults
    let meta = opts.extract || undefined
    if (meta && !meta.length) {
      meta = ['none']
    }

    const dataset = validators.hasDataset(this.client.clientConfig)
    const assetEndpoint = assetType === 'image' ? 'images' : 'files'
    const options = optionsFromFile(opts, body)
    const {label, title, description, creditLine, filename, source} = options
    const query = {
      label,
      title,
      description,
      filename,
      meta,
      creditLine,
    }
    if (source) {
      query.sourceId = source.id
      query.sourceName = source.name
      query.sourceUrl = source.url
    }
    const observable = this.client._requestObservable({
      method: 'POST',
      timeout: options.timeout || 0,
      uri: `/assets/${assetEndpoint}/${dataset}`,
      headers: options.contentType ? {'Content-Type': options.contentType} : {},
      query,
      body,
    })

    return this.client.isPromiseAPI()
      ? observable
          .pipe(
            filter((event) => event.type === 'response'),
            map((event) => toDocument(event.body))
          )
          .toPromise()
      : observable
  },

  delete(type, id) {
    // eslint-disable-next-line no-console
    console.warn('client.assets.delete() is deprecated, please use client.delete(<document-id>)')

    let docId = id || ''
    if (!/^(image|file)-/.test(docId)) {
      docId = `${type}-${docId}`
    } else if (type._id) {
      // We could be passing an entire asset document instead of an ID
      docId = type._id
    }

    validators.hasDataset(this.client.clientConfig)
    return this.client.delete(docId)
  },

  getImageUrl(ref, query) {
    const id = ref._ref || ref
    if (typeof id !== 'string') {
      throw new Error(
        'getImageUrl() needs either an object with a _ref, or a string with an asset document ID'
      )
    }

    if (!/^image-[A-Za-z0-9_]+-\d+x\d+-[a-z]{1,5}$/.test(id)) {
      throw new Error(
        `Unsupported asset ID "${id}". URL generation only works for auto-generated IDs.`
      )
    }

    const [, assetId, size, format] = id.split('-')

    validators.hasDataset(this.client.clientConfig)
    const {projectId, dataset} = this.client.clientConfig
    const qs = query ? queryString(query) : ''
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${size}.${format}${qs}`
  },
})

module.exports = AssetsClient
