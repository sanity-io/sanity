import createDatasetCommand from './createDatasetCommand'
import deleteDatasetCommand from './deleteDatasetCommand'
import applySubCommands from '../../util/applySubCommands'

const subCommands = [createDatasetCommand, deleteDatasetCommand]

export default {
  name: 'dataset',
  command: 'dataset',
  describe: 'Dataset-related commands',
  subCommands: subCommands,
  builder: applySubCommands(subCommands),
  handler: () => Promise.reject(new Error('Subcommand not specified'))
}
