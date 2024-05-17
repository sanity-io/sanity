import {isatty} from 'node:tty'

import {type SchemaValidationProblemGroup, type SchemaValidationProblemPath} from '@sanity/types'
import chalk from 'chalk'
import logSymbols from 'log-symbols'

const isTty = isatty(1)

const headers = {
  error: isTty ? chalk.bold(chalk.bgRed(chalk.black(' ERROR '))) : chalk.red('[ERROR]'),
  warning: isTty ? chalk.bold(chalk.bgYellow(chalk.black(' WARN '))) : chalk.yellow('[WARN]'),
}

const severityValues = {error: 0, warning: 1}

function formatPath(pathSegments: SchemaValidationProblemPath) {
  const format = (
    [curr, ...next]: SchemaValidationProblemPath,
    mode: 'object' | 'array' = 'object',
  ): string => {
    if (!curr) return ''
    if (curr.kind === 'property') return format(next, curr.name === 'of' ? 'array' : 'object')

    const name = curr.name ? curr.name : `<anonymous_${curr.type}>`
    return `${mode === 'array' ? `[${name}]` : `.${name}`}${format(next)}`
  }

  return format(pathSegments.slice(1)).slice(1) // removes the top-level type and leading `.`
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
            .map(({severity, message}) => `    ${logSymbols[severity]} ${message}`)
            .join('\n')

          return `${formattedPath}\n${formattedMessages}`
        })
        .join('\n')

      return `${header}\n${body}`
    })
    .join('\n\n')

  return formatted
}
