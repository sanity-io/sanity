import {isatty} from 'node:tty'

import {generateHelpUrl} from '@sanity/generate-help-url'
import {type SchemaValidationProblemGroup, type SchemaValidationProblemPath} from '@sanity/types'
import chalk from 'chalk'
import logSymbols from 'log-symbols'

const isTty = isatty(1)

const headers = {
  error: isTty ? chalk.bold(chalk.bgRed(chalk.black(' ERROR '))) : chalk.red('[ERROR]'),
  warning: isTty ? chalk.bold(chalk.bgYellow(chalk.black(' WARN '))) : chalk.yellow('[WARN]'),
}

const severityValues = {error: 0, warning: 1}

/**
 * Formats a schema validation path into a human-readable dot/bracket notation string.
 * e.g. `[{kind: 'type', name: 'post'}, {kind: 'property', name: 'of'}, {kind: 'type', name: 'image'}]`
 * becomes `[image]` (array notation because parent property was 'of').
 */
function formatPath(pathSegments: SchemaValidationProblemPath) {
  const format = (
    [curr, ...next]: SchemaValidationProblemPath,
    mode: 'object' | 'array' = 'object',
  ): string => {
    if (!curr) return ''
    // 'property' segments control notation for the next type segment:
    // 'of' property means array items, so use bracket notation; otherwise use dot notation
    if (curr.kind === 'property') return format(next, curr.name === 'of' ? 'array' : 'object')

    const name = curr.name ? curr.name : `<anonymous_${curr.type}>`
    return `${mode === 'array' ? `[${name}]` : `.${name}`}${format(next)}`
  }

  // Skip the first segment (top-level type) and trim the leading '.' from the result
  return format(pathSegments.slice(1)).slice(1)
}

export function getAggregatedSeverity(
  groupOrGroups: SchemaValidationProblemGroup | SchemaValidationProblemGroup[],
): 'error' | 'warning' {
  const groups = Array.isArray(groupOrGroups) ? groupOrGroups : [groupOrGroups]
  return groups
    .flatMap((group) => group.problems.map((problem) => problem.severity))
    .find((severity) => severity === 'error')
    ? 'error'
    : 'warning'
}

export function formatSchemaValidation(validation: SchemaValidationProblemGroup[]): string {
  let unnamedTopLevelTypeCount = 0
  // Group validation problems by their top-level schema type (e.g., 'post', 'author')
  // so errors can be displayed organized by which type they belong to
  const validationByType = Object.entries(
    validation.reduce<Record<string, SchemaValidationProblemGroup[]>>((acc, next) => {
      const [firstSegment] = next.path
      if (!firstSegment) return acc
      if (firstSegment.kind !== 'type') return acc

      const topLevelType =
        firstSegment.name || `<unnamed_${firstSegment.type}_type_${unnamedTopLevelTypeCount++}>`
      const problems = acc[topLevelType] ?? []

      problems.push(next)

      acc[topLevelType] = problems
      return acc
    }, {}),
  )

  // Sort types by severity (errors first), then alphabetically within each severity level
  const formatted = validationByType
    .sort((a, b) => {
      const [aType, aGroups] = a
      const [bType, bGroups] = b
      const aValue = severityValues[getAggregatedSeverity(aGroups)]
      const bValue = severityValues[getAggregatedSeverity(bGroups)]
      if (aValue === bValue) return aType.localeCompare(bType, 'en-US')
      return aValue - bValue
    })
    .map(([topLevelType, groups]) => {
      const formattedTopLevelType = isTty
        ? chalk.bgWhite(chalk.black(` ${topLevelType} `))
        : `[${topLevelType}]`

      const header = `${headers[getAggregatedSeverity(groups)]} ${formattedTopLevelType}`
      const body = groups
        .sort(
          (a, b) =>
            severityValues[getAggregatedSeverity(a)] - severityValues[getAggregatedSeverity(b)],
        )
        .map((group) => {
          const formattedPath = `  ${chalk.bold(formatPath(group.path) || '(root)')}`
          const formattedMessages = group.problems
            .sort((a, b) => severityValues[a.severity] - severityValues[b.severity])
            .map(({severity, message, helpId}) => {
              const help = helpId ? `\n      See ${generateHelpUrl(helpId)}` : ''
              return `    ${logSymbols[severity]} ${message}${help}`
            })
            .join('\n')

          return `${formattedPath}\n${formattedMessages}`
        })
        .join('\n')

      return `${header}\n${body}`
    })
    .join('\n\n')

  return formatted
}
