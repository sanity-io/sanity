import config from 'config:@sanity/data-aspects'
import bundledTypes from 'part:@sanity/base/bundled-types'
import {startCase} from 'lodash'
const bundledTypeNames = bundledTypes.types.map(baseType => baseType.name)


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
    return this.schema.types.find(currType => currType.name === typeName)
  }

  getInferredTypes() {
    let defaultTypes = this.schema.types || []
    defaultTypes = defaultTypes.filter(type => {
      // Exclude types which come bundled with Sanity
      return !bundledTypeNames.includes(type.name)
    })
    if (this.config.hiddenTypes) {
      // Exclude types which are explicitly named in hiddenTypes
      defaultTypes = defaultTypes.filter(type => {
        return !config.hiddenTypes.includes(type.name)
      })
    }
    return defaultTypes
  }

  fallbackItemDisplayField(typeName) {
    const type = this.getType(typeName)
    if (!type) {
      return null
    }
    const fieldsForType = type.fields || []
    const field = fieldsForType.find(currField => {
      return ['name', 'title', 'label'].includes(currField.name)
    })
    return field ? field.name : null
  }

  getItemDisplayField(typeName) {
    const typeOption = this.config.typeOptions[typeName]
    if (typeOption && typeOption.itemDisplayField) {
      return typeOption.itemDisplayField
    }
    return this.fallbackItemDisplayField(typeName)
  }

  getDisplayName(typeName) {
    const typeOption = this.config.typeOptions[typeName] || {}
    return typeOption.displayName || startCase(typeName)
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
    const selection = `"${keyForId}": .$id, "${keyForDisplayFieldName}": .${fieldName}`
    return `${this.schema.name}.${typeName} [${constraints}] {${selection}}`
  }

}

export default DataAspectsResolver
