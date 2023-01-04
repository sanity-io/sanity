import type {CliCommandContext, CliCommandDefinition} from '@sanity/cli'

const helpText = `
Options
  --dry-run Validate defined APIs, exiting with an error on breaking changes
  --force Deploy API without confirming breaking changes
  --api <api-id> Only deploy API with this ID. Can be specified multiple times.

The following options will override any setting from the CLI configuration file
(sanity.cli.js/sanity.cli.ts) - and applies to ALL defined APIs defined in that
configuration file. Tread with caution!

  --tag Deploy API(s) to given tag (defaults to 'default')
  --dataset <name> Deploy API for the given dataset
  --generation <gen1|gen2|gen3> API generation to deploy (defaults to 'gen3')
  --non-null-document-fields Use non-null document fields (_id, _type etc)
  --playground Enable GraphQL playground for easier debugging
  --no-playground Disable GraphQL playground

Examples
  # Deploy all defined GraphQL APIs
  sanity graphql deploy

  # Validate defined GraphQL APIs, check for breaking changes, skip deploy
  sanity graphql deploy --dry-run

  # Deploy only the GraphQL APIs with the IDs "staging" and "ios"
  sanity graphql deploy --api staging --api ios

  # Deploy all defined GraphQL APIs, overriding any playground setting
  sanity graphql deploy --playground
`

const deployGraphQLAPICommand: CliCommandDefinition = {
  name: 'deploy',
  signature: '',
  group: 'graphql',
  description: 'Deploy a GraphQL API from the current Sanity schema',
  action: async (args: {argv?: string[]}, context: CliCommandContext) => {
    const mod = await import('../../actions/graphql/deployApiAction')

    return mod.default(args, context)
  },
  helpText,
}

export default deployGraphQLAPICommand
