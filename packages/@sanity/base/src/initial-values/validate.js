import {isPlainObject} from 'lodash'
import oneline from 'oneline'
import {randomKey, toString as pathToString} from '@sanity/util/paths'

export {validateInitialValue, validateTemplates}

const REQUIRED_TEMPLATE_PROPS = ['id', 'title', 'schemaType', 'value']

function validateTemplates(templates) {
  const idMap = new Map()

  templates.forEach((template, i) => {
    const id = templateId(template, i)
    const missing = REQUIRED_TEMPLATE_PROPS.filter(prop => !template[prop])
    if (missing.length > 0) {
      throw new Error(`Template ${id} is missing required properties: ${missing.join(', ')}`)
    }

    if (typeof template.value !== 'function' && !isPlainObject(template.value)) {
      throw new Error(
        `Template ${id} has an invalid "value" property; should be a function or an object`
      )
    }

    if (idMap.has(template.id)) {
      const dupeIndex = idMap.get(template.id)
      const dupe = `${quote(templates[dupeIndex].title)} at index ${dupeIndex}`
      throw new Error(
        `Template "${template.title}" at index ${i} has the same ID ("${template.id}") as template ${dupe}`
      )
    }

    idMap.set(template.id, i)
  })

  return templates
}

function templateId(template, i) {
  return quote(template.id || template.title) || (typeof i === 'number' && `at index ${i}`) || ''
}

function quote(str) {
  return str && str.length > 0 ? `"${str}"` : str
}

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
    return validateValue(value)
  } catch (err) {
    err.message = contextError(err.message)
    throw err
  }
}

function validateValue(value, path = [], parentIsArray = false) {
  if (Array.isArray(value)) {
    return value.map((item, i) => validateValue(item, path.concat(i), true))
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
    acc[key] = validateValue(value[key], path.concat([key]))
    return acc
  }, initial)
}
