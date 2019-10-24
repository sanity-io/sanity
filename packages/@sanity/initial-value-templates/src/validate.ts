import oneline from 'oneline'
import {isPlainObject} from 'lodash'
import {randomKey, toString as pathToString} from '@sanity/util/paths'
import {Template} from './Template'
import {TemplateParameter} from './TemplateParameters'
import {getDefaultSchema} from './parts/Schema'

export {validateInitialValue, validateTemplates}

const ALLOWED_REF_PROPS = ['_key', '_ref', '_weak', '_type']
const REQUIRED_TEMPLATE_PROPS: (keyof Template)[] = ['id', 'title', 'schemaType', 'value']

function validateTemplates(templates: Template[]) {
  const idMap = new Map()

  templates.forEach((template, i) => {
    const id = templateId(template, i)

    if (typeof (template as {[key: string]: any}).values !== 'undefined' && !template.value) {
      throw new Error(`Template ${id} is missing "value" property, but contained "values". Typo?`)
    }

    const missing = REQUIRED_TEMPLATE_PROPS.filter(prop => !template[prop])
    if (missing.length > 0) {
      throw new Error(`Template ${id} is missing required properties: ${missing.join(', ')}`)
    }

    if (typeof template.value !== 'function' && !isPlainObject(template.value)) {
      throw new Error(
        `Template ${id} has an invalid "value" property; should be a function or an object`
      )
    }

    if (typeof template.parameters !== 'undefined') {
      if (Array.isArray(template.parameters)) {
        template.parameters.forEach((param, i) => validateParameter(param, template, i))
      } else {
        throw new Error(`Template ${id} has an invalid "parameters" property; must be an array`)
      }
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

function templateId(template: Template, i: number) {
  return quote(template.id || template.title) || (typeof i === 'number' && `at index ${i}`) || ''
}

function quote(str: string) {
  return str && str.length > 0 ? `"${str}"` : str
}

function validateInitialValue(value: {[key: string]: any}, template: Template) {
  const contextError = (msg: string) => `Template "${template.id}" initial value: ${msg}`

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

function validateValue(value: any, path: (string | number)[] = [], parentIsArray = false): any {
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      if (Array.isArray(item)) {
        throw new Error(
          `multidimensional arrays are not supported (at path "${pathToString(path)}")`
        )
      }

      return validateValue(item, path.concat(i), true)
    })
  }

  if (!isPlainObject(value)) {
    return value
  }

  // Apply missing keys is the parent is an array
  const initial: {[key: string]: any} = parentIsArray && !value._key ? {_key: randomKey()} : {}

  // Ensure non-root objects have _type
  if (path.length > 0 && !value._type) {
    if (value._ref) {
      // In the case of references, we know what the type should be, so apply it
      initial._type = 'reference'
    } else {
      throw new Error(`missing "_type" property at path "${pathToString(path)}"`)
    }
  }

  if (value._ref) {
    validateReference(value, path)
  }

  // Validate deeply
  return Object.keys(value).reduce((acc, key) => {
    acc[key] = validateValue(value[key], path.concat([key]))
    return acc
  }, initial)
}

function validateParameter(parameter: TemplateParameter, template: Template, index: number) {
  const schema = getDefaultSchema()

  if (!parameter.name) {
    throw new Error(
      `Template ${template.id} has a parameter at index ${index} that is missing its "name"-property`
    )
  }

  // I know, this is a weird one
  if (parameter.name === 'template') {
    throw new Error(
      `Template parameters cannot be named "template", see parameter #${index} for template ${template.id}`
    )
  }

  if (!schema.get(parameter.type)) {
    throw new Error(
      `Template parameter "${parameter.name}" has an invalid/unknown type: "${parameter.type}"`
    )
  }
}

function validateReference(value, path: (string | number)[] = []) {
  if (!value._type && value.type) {
    throw new Error(
      `Reference is missing "_type", but has a "type" property at path "${pathToString(path)}"`
    )
  }

  const disallowed = Object.keys(value).filter(key => !ALLOWED_REF_PROPS.includes(key))
  if (disallowed.length > 0) {
    const plural = disallowed.length > 1 ? 'properties' : 'property'
    throw new Error(
      `Disallowed ${plural} found in reference: ${disallowed
        .map(quote)
        .join(', ')} at path "${pathToString(path)}"`
    )
  }
}
