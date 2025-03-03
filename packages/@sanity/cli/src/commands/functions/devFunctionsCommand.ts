import open from 'open'

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

const defaultFlags = {
  port: 8080,
}

const devFunctionsCommand: CliCommandDefinition = {
  name: 'dev',
  group: 'functions',
  helpText,
  signature: '',
  description: 'Start the Sanity Function emulator',
  hideFromHelp: true,
  async action(args, context) {
    const {output} = context
    const {print} = output
    const flags = {...defaultFlags, ...args.extOptions}

    const {devAction} = await import('@sanity/runtime-cli')

    devAction(flags.port)

    print(`Server is running on port ${flags.port}\n`)
    open(`http://localhost:${flags.port}`)
  },
}

export default devFunctionsCommand
