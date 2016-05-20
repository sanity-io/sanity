import PropTypes from 'proptypes'

// primitive types are types that never needs type annotations, e.g their values maps directly to a
// native javascript/json-serializable type
export default {
  object: {
    options: {
      title: PropTypes.string,
      fields: PropTypes.object.isRequired
    },
    parse(options, typeBuilders, schema) {
      if (!options.fields) {
        throw new Error('Object types must have fields')
      }
      const fieldNames = Object.keys(options.fields)

      const fields = fieldNames.map(fieldName => {
        return Object.assign(options.fields[fieldName], {name: fieldName})
      })

      const keyedFields = {}
      fields.forEach(field => {

        if (field.name === '$type') {
          throw new Error('`$type` is reserved and cannot be used as field name.')
        }

        if (!(field || {}).type) {
          throw new Error(`Missing .type property for field "${field.name}".`)
        }

        const typeBuilder = typeBuilders[field.type]
        if (!typeBuilder) {
          throw new Error(
            `Invalid type "${field.type}" for field "${field.name}". Did you forget to declare the type ${field.type} in the schema?`
          )
        }
        keyedFields[field.name] = typeBuilder(field, typeBuilders, schema)
      })
      return {fields: keyedFields}
    }
  },
  boolean: {
    options: {
      title: PropTypes.string
    }
  },
  array: {
    options: {
      title: PropTypes.string,
      of: PropTypes.array.isRequired
    },
    parse(options, typeBuilders, schema) {
      const containsTypes = options.of.map(typeDef => {
        const typeBuilder = typeBuilders[typeDef.type]
        if (!typeBuilder) {
          throw new Error(`Invalid type: ${typeDef.type}.`)
        }
        return typeBuilder(typeDef, typeBuilders, schema)
      })
      return {of: containsTypes}
    }
  },
  number: {
    options: {
      title: PropTypes.string
    }
  },
  date: {
    options: {
      title: PropTypes.string,
      precision: PropTypes.oneOf(['second', 'minute', 'hour', 'day', 'month', 'year', 'decade', 'century'])
    },
    defaultOptions: {
      precision: 'minute'
    }
  },
  string: {
    options: {
      title: PropTypes.string,
      format: PropTypes.oneOf(['markdown', 'html', 'plain']),
      maxLength: PropTypes.number
    },
    defaultOptions: {
      format: 'plain'
    }
  }
}
