import type {CliCommandGroupDefinition} from '@sanity/cli'

const graphqlGroup: CliCommandGroupDefinition = {
  name: 'graphql',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: "Create and deploy changes to your project's GraphQL API(s)",
}

export default graphqlGroup
