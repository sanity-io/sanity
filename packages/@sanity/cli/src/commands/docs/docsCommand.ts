import open from 'open'

import {type CliCommandDefinition} from '../../types'

const docsCommand: CliCommandDefinition = {
  name: 'docs',
  helpText: '',
  signature: 'docs',
  description: 'Opens Sanity Studio documentation in your web browser',
  async action(args, context) {
    const {output} = context
    const {print} = output
    const url = 'https://www.sanity.io/docs'

    print(`Opening ${url}`)
    await open(url)
  },
}

export default docsCommand
