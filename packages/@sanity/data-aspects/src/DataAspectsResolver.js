import config from 'config:@sanity/data-aspects'
import {startCase} from 'lodash'
const bundledTypeNames = ['geopoint', 'richDate', 'date', 'sanity.imageAsset', 'sanity.fileAsset']

const BUNDLED_DOC_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']

function isDocumentType(type) {
  return type.type && type.type.name === 'document'
}
function isBundledDocType(typeName) {
  return BUNDLED_DOC_TYPES.includes(typeName)
}
function schemaHasUserDefinedDocumentTypes(schema) {
  return schema.getTypeNames().some(typeName => {
    return !isBundledDocType(typeName) && isDocumentType(schema.get(typeName))
  })
}

class DataAspectsResolver {

  constructor(schema) {
    this.schema = schema
    this.config = Object.assign({typeOptions: {}}, config || {})
  }

  getConfig() {
    return this.config
  }

  getField(type, fieldName) {
    return type.fields.filter(currField => currField.name === fieldName)
  }

  getType(typeName) {
    return this.schema.get(typeName)
  }

  inferTypesLegacy() {
    let defaultTypes = this.schema.getTypeNames() || []
    defaultTypes = defaultTypes.filter(typeName => {
      // Exclude types which come bundled with Sanity
      return !bundledTypeNames.includes(typeName)
    })
    if (this.config.hiddenTypes) {
      // Exclude types which are explicitly named in hiddenTypes
      defaultTypes = defaultTypes.filter(typeName => {
        return !this.config.hiddenTypes.includes(typeName)
      })
    }
    return defaultTypes.filter(typeName => {
      const schemaType = this.getType(typeName)
      return schemaType.type !== null
        && schemaType.jsonType === 'object'
    })
  }

  getDocumentTypes() {
    return this.schema.getTypeNames()
      .filter(typeName => !isBundledDocType(typeName) && isDocumentType(this.schema.get(typeName)))
  }

  getInferredTypes() {
    return schemaHasUserDefinedDocumentTypes(this.schema)
      ? this.getDocumentTypes(this.schema)
      : this.inferTypesLegacy()
  }

  getDisplayName(typeName) {
    const typeOption = this.config.typeOptions[typeName] || {}
    const type = this.getType(typeName)
    return typeOption.displayName || type.title || startCase(typeName)
  }

  // TODO: limit and offset is not yet implemented i gradient and only works partly because of a fluke
  // fix this when gql support limit, offset and order
  getListConstraints(typeName) {
    const typeOption = this.config.typeOptions[typeName]
    if (!typeOption) {
      return ''
    }
    const constraints = []
    if (typeOption.order) {
      // prefix order items with . because that's what gql requires
      //constraints.push(typeOptions.order)
    }
    if (typeOption.limit || typeOption.limit == 0) {
      constraints.push(`limit: ${typeOption.limit}`)
    }
    if (typeOption.offset) {
      constraints.push(`offset: ${typeOption.offset}`)
    }
    return constraints.filter(Boolean).join(', ')
  }

  getListQuery(options) {
    const {typeName, keyForId, keyForDisplayFieldName} = options
    const fieldName = this.getItemDisplayField(typeName)
    const constraints = this.getListConstraints(typeName)
    const selection = `"${keyForId}": _id, "${keyForDisplayFieldName}": ${fieldName}`
    return `${this.schema.name}.${typeName} [${constraints}] {${selection}}`
  }

}

export default DataAspectsResolver
