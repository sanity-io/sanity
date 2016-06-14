import PropTypes from 'proptypes'

export default {
  any: {
    options: {
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
  reference: {
    primitive: 'string',
    options: {
      title: PropTypes.string,
      to: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array
      ]).isRequired
    },
    parse(options, typeBuilders, schema) {
      const toTypeDefs = Array.isArray(options.to) ? options.to : [options.to]
      const toTypes = toTypeDefs.map(typeDef => {
        if (!typeDef.type) {
          throw new Error(`Missing type declaration on schema type "${typeDef.name}"`)
        }
        const typeBuilder = typeBuilders[typeDef.type]
        if (!typeBuilder) {
          throw new Error(
            `Missing type builder for ${typeDef.type}. Did you forget to declare the type "${typeDef.type}" in the schema?`
          )
        }
        return typeBuilder(typeDef, typeBuilders, schema)
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
