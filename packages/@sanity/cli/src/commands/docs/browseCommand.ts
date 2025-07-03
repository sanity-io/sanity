import open from 'open'

import {type CliCommandDefinition} from '../../types'

const browseCommand: CliCommandDefinition = {
  name: 'browse',
  group: 'docs',
  helpText: '',
  signature: '',
  description: 'Opens Sanity documentation in your web browser',
  async action(args, context) {
    const {output} = context
    const {print} = output
    const url = 'https://www.sanity.io/docs'

    print(`Opening ${url}`)
    await open(url)
  },
}

export default browseCommand
