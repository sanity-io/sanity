import path from 'path'
import open from 'open'
import fse from 'fs-extra'
import type {CliCommandDefinition} from '../../types'

const manageCommand: CliCommandDefinition = {
  name: 'manage',
  signature: 'manage',
  helpText: '',
  description: 'Opens the Sanity project management UI',
  async action(args, context) {
    const {workDir, output} = context
    const {print} = output
    const configLocation = path.join(workDir, 'sanity.json')

    // @todo v2/v3 compat
    let projectId
    try {
      const config = await fse.readJson(configLocation)
      projectId = config.api && config.api.projectId
    } catch (err) {
      // Noop.
    }

    const url = projectId
      ? `https://manage.sanity.io/projects/${projectId}`
      : 'https://manage.sanity.io/'

    print(`Opening ${url}`)
    open(url)
  },
}

export default manageCommand
