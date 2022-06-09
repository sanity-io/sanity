import type {CliCommandDefinition} from '@sanity/cli'
import type {CorsOrigin} from './types'

const helpText = `
Examples
  sanity cors list
`

const listCorsOriginsCommand: CliCommandDefinition = {
  name: 'list',
  group: 'cors',
  signature: '',
  helpText,
  description: 'List all origins allowed to access the API for this project',
  action: async (args, context) => {
    const {output} = context
    const {apiClient} = context
    const client = apiClient({requireUser: true, requireProject: true})
    const origins = await client.request<CorsOrigin[]>({url: '/cors'})
    output.print(origins.map((origin) => origin.origin).join('\n'))
  },
}

export default listCorsOriginsCommand
