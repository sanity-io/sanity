const generateHelpUrl = require('@sanity/generate-help-url')
const getSanitySchema = require('../../util/getSanitySchema')

module.exports = function validateSchema(flags, context) {
  const {strict} = flags
  const {workDir, output, chalk} = context

  const schema = getSanitySchema(workDir)
  if (!schema || !Array.isArray(schema._validation)) {
    throw new Error('Failed to resolve schema, or schema did not return expected value')
  }

  const validation = schema._validation

  const hasErrors = validation.some((group) =>
    group.problems.some((problem) => problem.severity === 'error')
  )
  const hasWarnings = validation.some((group) =>
    group.problems.some((problem) => problem.severity === 'warning')
  )

  if (hasErrors) {
    output.print(chalk.red('✗ Schema is invalid\n'))
  } else if (hasWarnings) {
    output.print(chalk.yellow('⚠️  Schema is valid, but has warnings\n'))
  } else {
    output.print(chalk.green('✓ Schema is valid'))
    return true
  }

  validation.forEach((group) => {
    output.print(`> ${renderPath(group.path)}`)

    group.problems.forEach((problem) => {
      const isWarning = problem.severity === 'warning'
      const symbol = isWarning ? '⚠️' : '✗'
      const colorize = isWarning ? chalk.yellow : chalk.red
      output.print(colorize(`  ${symbol}  ${problem.message}`))

      if (problem.helpId) {
        output.print(`  See ${generateHelpUrl(problem.helpId)}`)
      }

      // Newline for tidyness
      output.print('')
    })
  })

  const isInvalid = hasErrors || (strict && hasWarnings)
  return !isInvalid
}

function renderPath(path) {
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
