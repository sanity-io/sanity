import PropTypes from 'proptypes'
import {keyBy} from 'lodash'
import {ifNotUniqueProp} from './utils'

// primitive types are types that never needs type annotations, e.g their values maps directly to a
// native javascript/json-serializable type
export default {
  object: {
    options: {
      title: PropTypes.string.isRequired,
      fields: PropTypes.array.isRequired,
      fieldsets: PropTypes.array,
      displayField: PropTypes.string,
      options: PropTypes.object
    },
    defaultOptions: {
      fieldsets: [],
      options: {}
    },
    parse(typeDef, types) {
      if (!typeDef.fields) {
        throw new Error(`Object types must have fields. Please the check the definition of schema type "${typeDef.name}"`)
      }

      const fieldsets = (typeDef.fieldsets || []).map(fieldset => {
        return Object.assign({}, fieldset, {
          fieldset: true,
          fields: []
        })
      })

      ifNotUniqueProp(fieldsets, 'name', dupe => {
        throw new Error(`Duplicate fieldset found: ${dupe.name}. The field ${typeDef.name} has two fieldsets with the same name.`)
      })

      const fieldsetsByName = keyBy(fieldsets, 'name')

      const validatedFields = validateFields(typeDef.fields)

      const validatedFieldsets = validatedFields.map(field => {
        if (field.fieldset) {
          const fieldset = fieldsetsByName[field.fieldset]
          if (!fieldset) {
            throw new Error(`Group '${field.fieldset}' is not defined in schema for type '${typeDef.name}'`)
          }
          fieldset.fields.push(field)
          // Return the fieldset if its the first time we encounter a field in this fieldset
          return fieldset.fields.length === 1 ? fieldset : null
        }
        return {single: true, field}
      }).filter(Boolean)

      return {
        fields: validatedFields,
        fieldsets: validatedFieldsets,
        options: typeDef.options || {}
      }

      function validateFields(fields) {
        // Check for duplicates
        ifNotUniqueProp(fields, 'name', dupe => {
          throw new Error(`Duplicate field name: ${dupe.name} Please check the 'fields' property of schema type '${typeDef.name}'`)
        })
        return fields.map(field => {
          if (field.name === '_type') {
            throw new Error('`_type` is reserved and cannot be used as field name.')
          }

          if (field.fieldset) {
            return field
          }
          if (!(field || {}).type) {
            throw new Error(`Missing .type property for field "${field.name}".`)
          }

          const fieldType = types[field.type]
          if (!fieldType) {
            throw new Error(
              `Invalid type "${field.type}" for field "${field.name}". Did you forget to declare the type ${field.type} in the schema?`
            )
          }
          return fieldType.parse(field, types)
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
    parse(typeDef, types) {
      const containsTypes = typeDef.of.map(fieldDef => {
        const fieldType = types[fieldDef.type]
        if (!fieldType) {
          throw new Error(`Invalid type: ${fieldDef.type}.`)
        }
        return fieldType.parse(fieldDef, types)
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
      placeholder: PropTypes.string,
      format: PropTypes.oneOf(['markdown', 'html', 'plain']),
      maxLength: PropTypes.number
    },
    defaultOptions: {
      format: 'plain'
    }
  }
}
