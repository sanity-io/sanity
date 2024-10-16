import open from 'open'

import {type CliCommandDefinition} from '../../types'

const learnCommand: CliCommandDefinition = {
  name: 'learn',
  helpText: '',
  signature: 'learn',
  description: 'Opens Sanity Learn in your web browser',
  async action(args, context) {
    const {output} = context
    const {print} = output
    const url = 'https://www.sanity.io/learn'

    print(`Opening ${url}`)
    await open(url)
  },
}

export default learnCommand
