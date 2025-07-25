import {type CliOutputter} from '@sanity/cli'
import {generateHelpUrl} from '@sanity/generate-help-url'
import {type SchemaValidationProblemGroup} from '@sanity/types'
import {upperFirst} from 'lodash'
import logSymbols from 'log-symbols'

const consoleOutputter = {error: (...args: unknown[]) => console.error(...args)}

export class SchemaError extends Error {
  problemGroups: SchemaValidationProblemGroup[]

  constructor(problemGroups: SchemaValidationProblemGroup[]) {
    super('Schema errors encountered')
    this.name = 'SchemaError'
    this.problemGroups = problemGroups
  }

  print(output: CliOutputter): void {
    const logger = output || consoleOutputter
    logger.error('Uh oh… found errors in schema:\n')

    this.problemGroups.forEach((group) => {
      group.problems.forEach((problem) => {
        const icon = logSymbols[problem.severity] || logSymbols.info
        output.error(`  ${icon} ${upperFirst(problem.severity)}: ${getPath(group.path)}`)
        output.error(`  ${problem.message}`)
        if (problem.helpId) {
          output.error(`  See ${generateHelpUrl(problem.helpId)}`)
        }
        output.error('')
      })
    })
  }
}

function getPath(path: SchemaValidationProblemGroup['path']) {
  return path
    .map((segment) => {
      if (segment.kind === 'type' && segment.name && segment.type) {
        return `${segment.name} - (${segment.type})`
      }
      if (segment.kind === 'property' && segment.name) {
        return segment.name
      }
      return null
    })
    .filter(Boolean)
    .join(' / ')
}
