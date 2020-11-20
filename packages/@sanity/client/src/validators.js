const VALID_ASSET_TYPES = ['image', 'file']
const VALID_INSERT_LOCATIONS = ['before', 'after', 'replace']

exports.dataset = name => {
  if (!/^(~[a-z0-9]{1}[-\w]{0,25}|[a-z0-9]{1}[-\w]{0,19})$/.test(name)) {
    throw new Error(
      'Datasets can only contain lowercase characters, numbers, underscores and dashes, and start with tilde, and be maximum 20 characters'
    )
  }
}

exports.projectId = id => {
  if (!/^[-a-z0-9]+$/i.test(id)) {
    throw new Error('`projectId` can only contain only a-z, 0-9 and dashes')
  }
}

exports.validateAssetType = type => {
  if (VALID_ASSET_TYPES.indexOf(type) === -1) {
    throw new Error(`Invalid asset type: ${type}. Must be one of ${VALID_ASSET_TYPES.join(', ')}`)
  }
}

exports.validateObject = (op, val) => {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error(`${op}() takes an object of properties`)
  }
}

exports.requireDocumentId = (op, doc) => {
  if (!doc._id) {
    throw new Error(`${op}() requires that the document contains an ID ("_id" property)`)
  }

  exports.validateDocumentId(op, doc._id)
}

exports.validateDocumentId = (op, id) => {
  if (typeof id !== 'string' || !/^[a-z0-9_.-]+$/i.test(id)) {
    throw new Error(`${op}(): "${id}" is not a valid document ID`)
  }
}

exports.validateInsert = (at, selector, items) => {
  const signature = 'insert(at, selector, items)'
  if (VALID_INSERT_LOCATIONS.indexOf(at) === -1) {
    const valid = VALID_INSERT_LOCATIONS.map(loc => `"${loc}"`).join(', ')
    throw new Error(`${signature} takes an "at"-argument which is one of: ${valid}`)
  }

  if (typeof selector !== 'string') {
    throw new Error(`${signature} takes a "selector"-argument which must be a string`)
  }

  if (!Array.isArray(items)) {
    throw new Error(`${signature} takes an "items"-argument which must be an array`)
  }
}

exports.hasDataset = config => {
  if (!config.gradientMode && !config.dataset) {
    throw new Error('`dataset` must be provided to perform queries')
  }

  return config.dataset || ''
}
