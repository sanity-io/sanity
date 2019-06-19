/* eslint-disable import/prefer-default-export */
import T from '../../template-builder'
import {validateTemplates} from './validate'

function tryGetTemplates() {
  try {
    const templates = require('part:@sanity/base/initial-value-templates?')
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

function maybeSerialize(template) {
  return template.serialize ? template.serialize() : template
}

function getTemplates(schema) {
  let templates = tryGetTemplates()

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

  const serialized = templates.map(maybeSerialize)
  return validateTemplates(serialized)
}

export {getTemplates}
