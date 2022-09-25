import {SchemaValidationProblemPath} from '@sanity/types'

export function renderPath(path: SchemaValidationProblemPath) {
  return path
    .map((segment) => {
      if (segment.kind === 'type') {
        return `${segment.name || '<unnamed>'}(${segment.type})`
      }

      if (segment.kind === 'property') {
        return segment.name
      }

      return null
    })
    .filter(Boolean)
    .join(' > ')
}
