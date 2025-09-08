import {generateHelpUrl} from '@sanity/generate-help-url'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import {capitalize} from 'lodash'

import {getTypeInfo} from './SchemaProblemGroups'

export function formatSchemaErrorsToMarkdown(groups: SchemaValidationProblemGroup[]): string {
  let text = '# Schema errors\n\n'

  text +=
    'There were errors while attempting to compile the configuration of your Sanity Studio Schema types.\n\n'

  for (const group of groups) {
    const schemaType = getTypeInfo(group)

    if (schemaType) {
      text += `## ${capitalize(schemaType.type)} type "${schemaType.name}"\n\n`
    } else {
      text += `## Unknown type\n\n`
    }

    for (const segment of group.path) {
      text += `Path: `
      if (segment.kind === 'type') {
        text += `${segment.name || `<anonymous ${segment.type}>`}:${segment.type}`
      } else if (segment.kind === 'property') {
        text += `${segment.name}`
      }
    }
    text += '\n'

    for (const problem of group.problems) {
      text += `${capitalize(problem.severity)}: ${problem.message}\n`
      if (problem.helpId) {
        text += `[View documentation for this ${problem.severity}](${generateHelpUrl(problem.helpId)})\n`
      }
    }

    text += '\n'
  }

  return text
}
