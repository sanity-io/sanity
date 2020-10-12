const {upperFirst} = require('lodash')
const logSymbols = require('log-symbols')
const generateHelpUrl = require('@sanity/generate-help-url')

// eslint-disable-next-line no-console
const consoleOutputter = {error: (...args) => console.error(...args)}

module.exports = class SchemaError extends Error {
  constructor(problemGroups) {
    super('Schema errors encountered')
    this.problemGroups = problemGroups
  }

  print(output) {
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

function getPath(path) {
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
