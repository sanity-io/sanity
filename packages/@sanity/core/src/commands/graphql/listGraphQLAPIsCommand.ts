import type {CliCommandDefinition} from '@sanity/cli'
import {lazyRequire} from '../../util/lazyRequire'

const helpText = `
Examples
  sanity graphql list
`

const listGraphQLAPIsCommand: CliCommandDefinition = {
  name: 'list',
  signature: '',
  group: 'graphql',
  description: 'Lists all the GraphQL endpoints deployed for this project',
  action: lazyRequire(require.resolve('../../actions/graphql/listApisAction')),
  helpText,
}

export default listGraphQLAPIsCommand
