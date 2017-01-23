import PropTypes from 'proptypes'
import primitives from './primitives'

export const ASSET_FIELD = {
  name: 'asset',
  type: 'reference',
  to: [{type: 'imageAsset'}]
}

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
    primitive: 'object',
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
  image: {
    primitive: 'object',
    options: {
      title: PropTypes.string,
      fields: PropTypes.arrayOf(PropTypes.shape({
      }))
    },
    parse(typeDef, types) {
      const hasAssetField = (typeDef.fields || []).some(fieldDef => fieldDef.name === 'asset')
      if (hasAssetField) {
        // eslint-disable-next-line no-console
        console.error(new Error(
          'Found image type with a field named "asset". This should be removed as the "asset" field is impliclity added.'
          + ' Please remove it from the fields array of the following type definition in your schema:'
        ), typeDef)
      }

      const fields = [ASSET_FIELD].concat(
        (typeDef.fields || []).filter(fieldDef => fieldDef.name !== 'asset')
      )
      return primitives.object.parse(Object.assign({}, typeDef, {
        fields: fields
      }), types)
    }
  },
  imageAsset: {
    primitive: 'reference',
    options: {
      title: PropTypes.string
    }
  },
  slug: {
    primitive: 'object',
    options: {
      title: PropTypes.string,
      placeholder: PropTypes.string,
      source: PropTypes.string,
      maxLength: PropTypes.number
    },
    defaultOptions: {
      source: 'title',
      maxLength: 128
    }
  },
  file: {
    primitive: 'object',
    options: {
      title: PropTypes.string
    },
    parse(typeDef, types) {
      const hasAssetField = (typeDef.fields || []).some(fieldDef => fieldDef.name === 'asset')
      if (hasAssetField) {
        // eslint-disable-next-line no-console
        console.error(new Error(
          'Found file type with a field named "asset". This should be removed as the "asset" field is impliclity added.'
          + ' Please remove it from the fields array of the following type definition in your schema:'
        ), typeDef)
      }

      const fields = [ASSET_FIELD].concat(
        (typeDef.fields || []).filter(fieldDef => fieldDef.name !== 'asset')
      )
      return primitives.object.parse(Object.assign({}, typeDef, {
        fields: fields
      }), types)
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
  },
  paragraph: {
    primitive: 'object',
    options: {
      marks: PropTypes.array,
      title: PropTypes.string
    }
  },
  header: {
    primitive: 'object',
    options: {
      marks: PropTypes.array,
      level: PropTypes.number,
      title: PropTypes.string
    }
  },
  list: {
    primitive: 'object',
    options: {
      listStyle: PropTypes.string,
      title: PropTypes.string
    }
  },
  listItem: {
    primitive: 'object',
    options: {
      marks: PropTypes.array,
      title: PropTypes.string
    }
  },
  link: {
    primitive: 'object',
    options: {
      marks: PropTypes.array,
      title: PropTypes.string,
      target: PropTypes.string,
      href: PropTypes.string
    }
  }
}
