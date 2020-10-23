import printVersionResult from './printVersionResult'

const help = `
Shows a list of installed Sanity modules and their respective versions, and
checks the npm registry for the latest available versions.`

export default {
  name: 'versions',
  signature: '',
  description: 'Shows the installed versions of Sanity CLI and core components',
  helpText: help,
  action: printVersionResult,
}
