/* eslint-disable import/prefer-default-export */
import T from './builder'
import {validateTemplates} from './validate'
import {Template, TemplateBuilder} from './Template'
import {Schema} from './parts/Schema'
import {isBuilder} from './resolve'

interface CommonJsEsStub {
  __esModule: boolean
  default: (Template | TemplateBuilder)[]
}

function isCommonJsEsStub(mod: any): mod is CommonJsEsStub {
  const stub = mod as CommonJsEsStub
  return stub.__esModule && 'default' in stub
}

function loadDefinedTemplatesFromPart() {
  try {
    const templates:
      | undefined
      | (Template | TemplateBuilder)[]
      | CommonJsEsStub = require('part:@sanity/base/initial-value-templates?')

    if (typeof templates === 'undefined') {
      return undefined
    }

    if (!templates) {
      return null
    }

    if (isCommonJsEsStub(templates)) {
      return templates.default
    }

    return templates
  } catch (err) {
    return undefined
  }
}

function loadDefinedTemplates(schema?: Schema) {
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

function prepareTemplates(templates: (Template | TemplateBuilder)[]) {
  const serialized = templates.map(maybeSerialize)
  return validateTemplates(serialized)
}

function getDefaultTemplates(schema?: Schema) {
  return prepareTemplates(T.defaults(schema))
}

function maybeSerialize(template: Template | TemplateBuilder) {
  return isBuilder(template) ? template.serialize() : template
}

export function getTemplateErrors(schema: Schema) {
  try {
    loadDefinedTemplates(schema)
    return []
  } catch (err) {
    return [err]
  }
}

export function getTemplates(schema?: Schema) {
  try {
    return loadDefinedTemplates(schema)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to load defined templates, falling back to defaults:\n%s', err.message)
    return getDefaultTemplates(schema)
  }
}

export function getParameterlessTemplatesBySchemaType(schemaType: string) {
  return getTemplatesBySchemaType(schemaType).filter(
    tpl => !tpl.parameters || !tpl.parameters.length
  )
}

export function getTemplatesBySchemaType(schemaType: string) {
  return getTemplates().filter(tpl => tpl.schemaType === schemaType)
}

export function getTemplateById(id: string) {
  return getTemplates().find(tpl => tpl.id === id)
}

export function templateExists(id: string) {
  return Boolean(getTemplateById(id))
}
