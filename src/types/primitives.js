import PropTypes from 'proptypes'
import {keyBy} from 'lodash'
import {ifNotUniqueProp} from "./utils";

// primitive types are types that never needs type annotations, e.g their values maps directly to a
// native javascript/json-serializable type
export default {
  object: {
    options: {
      title: PropTypes.string,
      fields: PropTypes.array.isRequired,
      groups: PropTypes.array
    },
    defaultOptions: {
      groups: []
    },
    parse(options, typeBuilders, schema) {
      if (!options.fields) {
        throw new Error('Object types must have fields')
      }

      const preparedFields = prepareFields(options.fields)

      const groups = options.groups.map(group => {
        return Object.assign({}, group, {
          group: true,
          fields: []
        })
      })

      const groupsByName = keyBy(groups, 'name')

      const fieldGroups = preparedFields.map(field => {
        if (field.group) {
          const group = groupsByName[field.group]
          if (!group) {
            throw new Error(`Group '${field.group}' is not defined in schema for type '${options.name}'`)
          }
          group.fields.push(field)
          // Return the group if its the first time we encounter a field in this group
          return group.fields.length === 1 ? group : null
        }
        return {ungrouped: true, field: field}
      }).filter(Boolean)

      return {
        fields: preparedFields,
        fieldGroups: fieldGroups
      }

      function prepareFields(fields) {
        // Check for duplicates
        ifNotUniqueProp(fields, 'name', dupe => {
          throw new Error(`Duplicate field name: ${dupe.name} Please check the 'fields' property of schema type '${options.name}'`)
        })
        return fields.map(field => {
          if (field.name === '$type') {
            throw new Error('`$type` is reserved and cannot be used as field name.')
          }

          if (field.group) {
            return field
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
          return typeBuilder(field, typeBuilders, schema)
        })

      }
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
