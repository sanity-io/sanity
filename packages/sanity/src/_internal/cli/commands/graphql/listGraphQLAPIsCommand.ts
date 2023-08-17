import type {CliCommandArguments, CliCommandContext, CliCommandDefinition} from '@sanity/cli'

const helpText = `
Examples
  sanity graphql list
`

const listGraphQLAPIsCommand: CliCommandDefinition = {
  name: 'list',
  signature: '',
  group: 'graphql',
  description: 'Lists all the GraphQL endpoints deployed for this project',
  action: async (
    args: CliCommandArguments<Record<string, unknown>>,
    context: CliCommandContext,
  ) => {
    const mod = await import('../../actions/graphql/listApisAction')

    return mod.default(args, context)
  },
  helpText,
}

export default listGraphQLAPIsCommand
