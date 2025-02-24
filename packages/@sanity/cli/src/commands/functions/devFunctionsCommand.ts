import {type CliCommandDefinition} from '../../types'

const helpText = `
Options
  --port <port> Port to start emulator on

Examples
  # Start dev server on default port
  sanity functions dev

  # Start dev server on specific port
  sanity functions dev --port 3333
`

const devFunctionsCommand: CliCommandDefinition = {
  name: 'dev',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Start the Sanity Function emulator',
  async action(args, context) {
    const {output} = context
    const {print} = output

    print(`Functions stuff`)
  },
}

export default devFunctionsCommand
