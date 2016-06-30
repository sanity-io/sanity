import PropTypes from 'proptypes'

export default {
  any: {
    options: {
      of: PropTypes.array.isRequired
    },
    parse(typeDef, types) {
      const containsTypes = typeDef.of.map(fieldDef => {
        const type = types[fieldDef.type]
        if (!type) {
          throw new Error(`Invalid type: ${fieldDef.type}.`)
        }
        return type.parse(fieldDef, types)
      })
      return Object.assign({}, typeDef, {of: containsTypes})
    }
  },
  reference: {
    primitive: 'string',
    options: {
      title: PropTypes.string,
      to: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
      ]).isRequired
    },
    parse(typeDef, types) {
      const toFields = Array.isArray(typeDef.to) ? typeDef.to : [typeDef.to]
      const toTypes = toFields.map(toField => {
        if (!toField.type) {
          throw new Error(`Missing type declaration on schema type "${toField.name}"`)
        }
        const type = types[toField.type]
        if (!type) {
          throw new Error(
            `Missing type builder for ${toField.type}. Did you forget to declare the type "${toField.type}" in the schema?`
          )
        }
        return type.parse(toField, types)
      })
      return {to: toTypes}
    }
  },
  text: {
    primitive: 'string',
    options: {
      title: PropTypes.string,
      format: PropTypes.oneOf(['markdown', 'html', 'plain']),
      maxLength: PropTypes.number
    },
    defaultOptions: {
      format: 'plain'
    }
  },
  url: {
    primitive: 'string',
    options: {
      title: PropTypes.string
    }
  },
  email: {
    primitive: 'string',
    options: {
      title: PropTypes.string
    }
  },
  telephone: {
    primitive: 'string',
    options: {
      title: PropTypes.string
    }
  },
  blocks: {
    primitive: 'array',
    options: {
      title: PropTypes.string
    }
  }
}
