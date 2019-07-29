/* eslint-disable import/prefer-default-export */
import T from '../../template-builder'
import {validateTemplates} from './validate'

function loadDefinedTemplatesFromPart() {
  try {
    const templates = require('part:@sanity/base/initial-value-templates?')
    if (typeof templates === 'undefined') {
      return undefined
    }

    if (!templates) {
      return null
    }

    if (templates.__esModule && 'default' in templates) {
      return templates.default
    }

    return templates
  } catch (err) {
    return undefined
  }
}

function loadDefinedTemplates(schema) {
  let templates = loadDefinedTemplatesFromPart()

  // Templates is `null` if the part was implemented but the export doesn't make sense,
  // if it is not found (require failed), the value will be `undefined`
  if (templates === null || (templates && !Array.isArray(templates))) {
    const type = templates === null ? `null` : typeof templates
    throw new Error(
      `'part:@sanity/base/initial-value-templates' should be an array of templates, got ${type}`
    )
  }

  if (!templates) {
    templates = T.defaults(schema)
  }

  return prepareTemplates(templates)
}

function prepareTemplates(templates) {
  const serialized = templates.map(maybeSerialize)
  return validateTemplates(serialized)
}

function getDefaultTemplates(schema) {
  return prepareTemplates(T.defaults(schema))
}

function maybeSerialize(template) {
  return template.serialize ? template.serialize() : template
}

export function getTemplateErrors(schema) {
  try {
    loadDefinedTemplates(schema)
    return []
  } catch (err) {
    return [err]
  }
}

export function getTemplates(schema) {
  try {
    return loadDefinedTemplates(schema)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load defined templates, falling back to defaults:\n%s', err.message)
    return getDefaultTemplates(schema)
  }
}

export function getTemplatesBySchemaType(schemaType) {
  return getTemplates().filter(tpl => tpl.schemaType === schemaType)
}

export function getTemplateById(id) {
  return getTemplates().find(tpl => tpl.id === id)
}

export function templateExists(id) {
  return Boolean(getTemplateById(id))
}
