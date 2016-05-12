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
        const typeBuilder = typeBuilders[typeDef.type]
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
  }
}
