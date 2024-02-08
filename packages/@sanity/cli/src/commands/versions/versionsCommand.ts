import printVersionResult from './printVersionResult'

const help = `
Shows a list of installed Sanity modules and their respective versions, and
checks the npm registry for the latest available versions.`

export default {
  name: 'versions',
  signature: '',
  description: 'Shows installed versions of Sanity Studio and components',
  helpText: help,
  action: printVersionResult,
}
