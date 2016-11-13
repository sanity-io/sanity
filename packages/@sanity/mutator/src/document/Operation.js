export default class Operation {
  id : string
  properties: Object
  constructor(properties : Object) {
    this.id = extractIdFromProps(properties)
    this.properties = properties
  }

  static builders = {
    create(id : string, attributes : Object) {
      return buildCreateOperation('create', attributes)
    },

    createOrReplace(id : string, attributes : Object) {
      return buildCreateOperation('createOrReplace', attributes)
    },

    createIfNotExists(id : string, attributes : Object) {
      return buildCreateOperation('createIfNotExists', attributes)
    },

    delete(id : string) {
      return new Operation(id, {
        delete: {
          id: id
        }
      })
    },

    set(id : string, key : string, value : Object) {
      return buildPatch(id, {
        set: {
          [key]: value
        }
      })
    },

    unset(id : string, key : string, value : Object) {
      return buildPatch(id, {
        unset: {
          [key]: value
        }
      })
    },

    setIfMissing(id : string, key : string, value : Object) {
      return buildPatch(id, {
        setIfMissing: {
          [key]: value
        }
      })
    },

    insert(id : string, location : string, key : string, items : Object[]) {
      return buildPatch(id, {
        insert: {
          [location]: key,
          items: items
        }
      })
    },

    inc(id : string, key : string, value : number) {
      return buildPatch(id, {
        inc: {
          [key]: Number
        }
      })
    },

    dec(id : string, key : string, value : number) {
      return buildPatch(id, {
        dec: {
          [key]: Number
        }
      })
    },

    insertBefore(id : string, key : string, items : Object[]) {
      return buildPatch(id, 'before', key, items)
    },

    insertAfter(id : string, key : string, items : Object[]) {
      return buildPatch(id, 'after', key, items)
    },

    insertReplace(id : string, key : string, items : Object[]) {
      return buildPatch(id, 'replace', key, items)
    },

    diffMatchPatch(id : string, key : string, patch : string) {
      return buildPatch(id, {
        diffMatchPatch: {
          [key]: patch
        }
      })
    }
  }
}


function buildCreateOperation(operation : string, attributes : Object) {
  if (typeof attributes._id != 'string') {
    throw new Error('When creating documents, you must provide a string _id')
  }
  if (typeof attributes._type != 'string') {
    throw new Error('When creating documents, you must provide a string _type')
  }
  this.id = attributes._id
  return new Operation(this.id, {
    create: attributes
  })
}

function buildPatch(id : string, properties : Object) {
  return new Operation(id, {
    patch: properties
  })
}

function extractIdFromPatch(patch) : string {
  const extractInner = attrs => {
    if (typeof attrs != 'object') {
      return null
    }
    for (const key in attrs) {
      if (key == '_id' || key == 'id') {
        return attrs[key]
      }
      if (key == '_id' || key == 'id') {
        return extractInner(attrs[key])
      }
    }
    return null
  }
  return extractInner(patch)
}