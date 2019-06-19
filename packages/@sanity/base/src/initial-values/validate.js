import {isPlainObject} from 'lodash'
import oneline from 'oneline'
import {randomKey, toString as pathToString} from '@sanity/util/paths'

export {validateInitialValue}

function validateInitialValue(value, template) {
  const contextError = msg => `Template "${template.id}" initial value: ${msg}`

  if (!isPlainObject(value)) {
    throw new Error(contextError(`resolved to a non-object`))
  }

  if (value._type && template.schemaType !== value._type) {
    throw new Error(
      contextError(oneline`
        includes "_type"-property (${value._type})
        that does not match template (${template.schemaType})
      `)
    )
  }

  try {
    return validate(value)
  } catch (err) {
    err.message = contextError(err.message)
    throw err
  }
}

function validate(value, path = [], parentIsArray = false) {
  if (Array.isArray(value)) {
    return value.map((item, i) => validate(item, path.concat(i), true))
  }

  if (!isPlainObject(value)) {
    return value
  }

  // Apply missing keys is the parent is an array
  const initial = parentIsArray && !value._key ? {_key: randomKey()} : {}

  // Ensure non-root objects have _type
  if (path.length > 0 && !value._type) {
    if (value._ref) {
      // In the case of references, we know what the type should be, so apply it
      initial._type = 'reference'
    } else {
      throw new Error(`missing "_type" property at path "${pathToString(path)}"`)
    }
  }

  // Validate deeply
  return Object.keys(value).reduce((acc, key) => {
    acc[key] = validate(value[key], path.concat([key]))
    return acc
  }, initial)
}
