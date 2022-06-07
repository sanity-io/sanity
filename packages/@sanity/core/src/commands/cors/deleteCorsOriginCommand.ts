import type {CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {CorsOrigin} from './types'

const helpText = `
Examples
  sanity cors delete
  sanity cors delete http://localhost:3000
`

const deleteCorsOriginCommand: CliCommandDefinition = {
  name: 'delete',
  group: 'cors',
  signature: '[ORIGIN]',
  helpText,
  description: 'Delete an existing CORS-origin from your project',
  action: async (args, context) => {
    const {output, apiClient} = context
    const [origin] = args.argsWithoutOptions
    const client = apiClient({requireUser: true, requireProject: true})
    const originId = await promptForOrigin(origin, context)
    try {
      await client.request({method: 'DELETE', uri: `/cors/${originId}`})
      output.print('Origin deleted')
    } catch (err) {
      throw new Error(`Origin deletion failed:\n${err.message}`)
    }
  },
}

export default deleteCorsOriginCommand

async function promptForOrigin(specified: string | undefined, context: CliCommandContext) {
  const specifiedOrigin = specified && specified.toLowerCase()
  const {prompt, apiClient} = context
  const client = apiClient({requireUser: true, requireProject: true})

  const origins = await client.request<CorsOrigin[]>({url: '/cors'})
  if (specifiedOrigin) {
    const selected = origins.filter((origin) => origin.origin.toLowerCase() === specifiedOrigin)[0]
    if (!selected) {
      throw new Error(`Origin "${specified} not found"`)
    }

    return selected.id
  }

  const choices = origins.map((origin) => ({value: origin.id, name: origin.origin}))
  return prompt.single({
    message: 'Select origin to delete',
    type: 'list',
    choices,
  })
}
