import open from 'open'
import type {CliCommandDefinition} from '../../types'

const manageCommand: CliCommandDefinition = {
  name: 'manage',
  signature: 'manage',
  helpText: '',
  description: 'Opens the Sanity project management UI',
  async action(args, context) {
    const {output, cliConfig} = context
    const {print} = output
    const projectId = cliConfig?.api?.projectId

    const url = projectId
      ? `https://manage.sanity.io/projects/${projectId}`
      : 'https://manage.sanity.io/'

    print(`Opening ${url}`)
    await open(url)
  },
}

export default manageCommand
