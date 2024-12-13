/* eslint-disable tsdoc/syntax */
/**
 * @typedef {Object} ESLintMessage
 * @property {string} ruleId - The ID of the rule that generated the message
 * @property {number} line - Line number where the issue occurred
 * @property {number} column - Column number where the issue occurred
 * @property {string} message - The message to display
 * @property {1|2} severity - 1 for warning, 2 for error
 */

/**
 * @typedef {Object} ESLintResult
 * @property {string} filePath - The file path relative to the root
 * @property {ESLintMessage[]} messages - Array of message objects
 * @property {number} errorCount - Number of errors
 * @property {number} warningCount - Number of warnings
 * @property {number} fixableErrorCount - Number of fixable errors
 * @property {number} fixableWarningCount - Number of fixable warnings
 */

const {writeFile} = require('node:fs/promises')
const path = require('node:path')

/**
 * ESLint custom formatter
 * @param {ESLintResult[]} results - The results from ESLint's execution
 * @returns {Promise<string>} Formatted output
 */
module.exports = async function (results) {
  const projectRoot = path.resolve(__dirname, '..')
  const outputPath = path.join(projectRoot, 'dev/test-studio/.react-compiler-bailout-report.json')
  const paths = []
  for (const result of results) {
    if (result.messages.length) {
      const relativePath = path.relative(projectRoot, result.filePath)
      paths.push(relativePath)
    }
  }
  const formattedResults = JSON.stringify(paths, null, 2)
  await writeFile(outputPath, formattedResults, 'utf8')
  return `${paths.length} files have React compiler bailouts. See ${outputPath} for the full list.`
}
