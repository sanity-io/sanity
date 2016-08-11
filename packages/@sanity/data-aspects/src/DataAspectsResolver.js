import config from 'config:@sanity/data-aspects'
import bundledTypes from 'role:@sanity/base/bundled-types'


class DataAspectsResolver {

  constructor(schema) {
    this.schema = schema
    this.config = Object.assign({listOptions: {}}, config || {})
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
      return !Object.keys(bundledTypes).includes(type.name)
    })
    if (this.config.hiddenTypes) {
      // Exclude types which are explicitly named in hiddenTypes
      defaultTypes = defaultTypes.filter(type => {
        return !config.hiddenTypes.includes(type.name)
      })
    }
    return defaultTypes
  }

  fallbackDisplayFieldName(typeName) {
    const type = this.getType(typeName)
    const field = type.fields.find(currField => {
      return ['name', 'title', 'label'].includes(currField.name)
    })
    return field ? field.name : null
  }

  getDisplayFieldName(typeName) {
    const listOptions = this.config.listOptions[typeName]
    if (listOptions && listOptions.displayField) {
      return listOptions.displayField
    }
    return this.fallbackDisplayFieldName(typeName)
  }

  // TODO: limit and offset is not yet implemented i gradient and only works partly because of a fluke
  // fix this when gql support limit, offset and order
  getListConstraints(typeName) {
    const listOptions = this.config.listOptions[typeName]
    if (!listOptions) {
      return ''
    }
    const constraints = []
    if (listOptions.order) {
      // prefix order items with . because that's what gql requires
      //constraints.push(listOptions.order)
    }
    if (listOptions.limit || listOptions.limit == 0) {
      constraints.push(`limit: ${listOptions.limit}`)
    }
    if (listOptions.offset) {
      constraints.push(`offset: ${listOptions.offset}`)
    }
    return constraints.filter(Boolean).join(', ')
  }

  getListQuery(options) {
    const {typeName, keyForId, keyForDisplayFieldName} = options
    const fieldName = this.getDisplayFieldName(typeName)
    const constraints = this.getListConstraints(typeName)
    const selection = `"${keyForId}": .$id, "${keyForDisplayFieldName}": .${fieldName}`
    return `${this.schema.name}.${typeName} [${constraints}] {${selection}}`
  }

}

export default DataAspectsResolver
