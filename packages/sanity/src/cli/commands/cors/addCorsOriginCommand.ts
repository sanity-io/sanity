import fs from 'fs'
import path from 'path'
import type {CliCommandDefinition} from '@sanity/cli'
import {addCorsOrigin} from '../../actions/cors/addCorsOrigin'

const helpText = `
Options
  --credentials Allow credentials (token/cookie) to be sent from this origin
  --no-credentials Disallow credentials (token/cookie) to be sent from this origin

Examples
  sanity cors add
  sanity cors add http://localhost:3000 --no-credentials
`

const addCorsOriginCommand: CliCommandDefinition = {
  name: 'add',
  group: 'cors',
  signature: '[ORIGIN]',
  helpText,
  description: 'Allow a new origin to use your project API through CORS',
  action: async (args, context) => {
    const {output} = context
    const [origin] = args.argsWithoutOptions

    if (!origin) {
      throw new Error('No origin specified, use `sanity cors add <origin-url>`')
    }

    const flags = args.extOptions

    // eslint-disable-next-line no-sync
    const isFile = await fs.existsSync(path.join(process.cwd(), origin))
    if (isFile) {
      output.warn(`Origin "${origin}?" Remember to quote values (sanity cors add "*")`)
    }

    const success = await addCorsOrigin(origin, flags, context)
    if (success) {
      output.print('CORS origin added successfully')
    }
  },
}

export default addCorsOriginCommand
