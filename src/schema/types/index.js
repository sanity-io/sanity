import primitives from './primitives'
import bundled from './bundled'
import PropTypes from 'proptypes'
import {difference} from 'lodash'

const all = Object.assign({}, primitives, bundled)

const IMPLICIT_OPTIONS = {
  type: PropTypes.string.isRequired,
  name: PropTypes.string,
  primitive: PropTypes.string,
  description: PropTypes.string,
  required: PropTypes.bool,
  editor: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  options: PropTypes.object
}

export function wrapBaseType(baseType) {

  const definedOptions = Object.assign({}, IMPLICIT_OPTIONS, baseType.options)
  const allowedOptionNames = Object.keys(definedOptions)

  return {
    parse(typeDef, types) {
      const givenOptionNames = Object.keys(typeDef)
      const undeclared = difference(givenOptionNames, allowedOptionNames)

      const result = check()
      if (result.length) {
        result.forEach(validation => {
          console.warn('[Warning] %s', validation.error.message) // eslint-disable-line no-console
        })
      }

      const typeDefWithDefaults = Object.assign({}, baseType.defaultOptions, typeDef)
      return Object.assign({}, typeDef, baseType.parse ? baseType.parse(typeDefWithDefaults, types) : typeDefWithDefaults)

      function check() {

        let errors = []

        if (undeclared.length) {
          errors = undeclared.map(optionName => {
            return {
              typeDef,
              error: `Unknown property "${optionName}" on type "${typeDef.type}". Please check the type definition for "${typeDef.name}"`
            }
          })
        }

        return errors.concat(Object.keys(definedOptions).map(optionName => {
          const err = definedOptions[optionName](typeDef, optionName, typeDef.name, 'prop')
          if (err) {
            return {
              typeDef,
              error: err
            }
          }
          return null
        }).filter(Boolean))
      }
    }
  }
}

const wrappedTypes = {}
Object.keys(all).forEach(typeName => {
  wrappedTypes[typeName] = wrapBaseType(all[typeName])
})

export default wrappedTypes
