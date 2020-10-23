import path from 'path'
import open from 'opn'
import fse from 'fs-extra'

export default {
  name: 'manage',
  signature: 'manage',
  description: 'Opens the Sanity project management UI',
  async action(args, context) {
    const {workDir, output} = context
    const {print} = output
    const configLocation = path.join(workDir, 'sanity.json')

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
    open(url, {wait: false})
  },
}
