import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'
import type {DeleteGraphQLApiFlags} from '../../actions/graphql/deleteApiAction'

const helpText = `
Options
  --api <api-id> Undeploy API with this ID (project, dataset and tag flags takes preference)
  --project <projectId> Project ID to delete GraphQL API for
  --dataset <dataset> Delete GraphQL API for the given dataset
  --tag <tag> Delete GraphQL API for the given tag (defaults to 'default')
  --force Skip confirmation prompt, forcefully undeploying the GraphQL API

Examples
  sanity graphql undeploy
  sanity graphql undeploy --api ios
  sanity graphql undeploy --dataset staging
  sanity graphql undeploy --dataset staging --tag next
`

const deleteGraphQLAPICommand: CliCommandDefinition = {
  name: 'undeploy',
  group: 'graphql',
  signature: '',
  description: 'Remove a deployed GraphQL API',
  action: async (args: CliCommandArguments<DeleteGraphQLApiFlags>, context: CliCommandContext) => {
    const mod = await import('../../actions/graphql/deleteApiAction')

    return mod.default(args, context)
  },
  helpText,
}

export default deleteGraphQLAPICommand
