import type {CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {Hook} from './types'

const deleteHookCommand: CliCommandDefinition = {
  name: 'delete',
  group: 'hook',
  signature: '[NAME]',
  helpText: '',
  description: 'Delete a hook within your project',
  action: async (args, context) => {
    const {apiClient} = context
    const [name] = args.argsWithoutOptions
    const client = apiClient()

    const hookId = await promptForHook(name, context)
    try {
      await client
        .clone()
        .config({apiVersion: '2021-10-04'})
        .request({method: 'DELETE', uri: `/hooks/${hookId}`})
    } catch (err) {
      throw new Error(`Hook deletion failed:\n${err.message}`)
    }
  },
}

async function promptForHook(specified: string | undefined, context: CliCommandContext) {
  const specifiedName = specified && specified.toLowerCase()
  const {prompt, apiClient} = context
  const client = apiClient()

  const hooks = await client
    .clone()
    .config({apiVersion: '2021-10-04'})
    .request<Hook[]>({uri: '/hooks', json: true})

  if (specifiedName) {
    const selected = hooks.filter((hook) => hook.name.toLowerCase() === specifiedName)[0]
    if (!selected) {
      throw new Error(`Hook with name "${specified} not found"`)
    }

    return selected.id
  }

  const choices = hooks.map((hook) => ({value: hook.id, name: hook.name}))
  return prompt.single({
    message: 'Select hook to delete',
    type: 'list',
    choices,
  })
}

export default deleteHookCommand
