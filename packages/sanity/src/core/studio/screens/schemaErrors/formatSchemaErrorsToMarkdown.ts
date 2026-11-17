import {generateHelpUrl} from '@sanity/generate-help-url'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import capitalize from 'lodash-es/capitalize.js'

import {type SchemaErrorContext} from '../../../config/SchemaError'
import {getTypeInfo} from './getTypeInfo'

export function formatSchemaErrorsToMarkdown(
  groups: SchemaValidationProblemGroup[],
  context?: SchemaErrorContext,
): string {
  let text = '# Schema errors\n\n'

  text +=
    'There were errors while attempting to compile the configuration of your Sanity Studio Schema types.\n\n'

  if (context) {
    text += `- Workspace: ${context.workspaceName}\n`
    if (context.sourceName) {
      text += `- Source: ${context.sourceName}\n`
    }
    text += `- Project ID: ${context.projectId}\n`
    text += `- Dataset: ${context.dataset}\n\n`
  }

  for (const group of groups) {
    const schemaType = getTypeInfo(group)

    if (schemaType) {
      text += `## ${capitalize(schemaType.type)} type "${schemaType.name}"\n\n`
    } else {
      text += `## Unknown type\n\n`
    }

    const parts: string[] = []
    for (const segment of group.path) {
      if (segment.kind === 'type') {
        parts.push(`${segment.name || `<anonymous ${segment.type}>`}:${segment.type}`)
      } else if (segment.kind === 'property') {
        parts.push(`${segment.name}`)
      }
    }
    text += `Path: ${parts.join(' → ')}\n`

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
