import type {CliCommandGroupDefinition} from '@sanity/cli'

const graphqlGroup: CliCommandGroupDefinition = {
  name: 'graphql',
  signature: '[COMMAND]',
  isGroupRoot: true,
  description: 'Interact with GraphQL APIs',
}

export default graphqlGroup
