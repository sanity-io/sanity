import type {CliCommandDefinition} from '@sanity/cli'
import {lazyRequire} from '../../util/lazyRequire'

const helpText = `
Options
  --project <projectId> Project ID to delete GraphQL API for
  --dataset <dataset> Delete GraphQL API for the given dataset
  --tag <tag> Delete GraphQL API for the given tag (defaults to 'default')

Examples
  sanity graphql undeploy
  sanity graphql undeploy --dataset staging
  sanity graphql undeploy --dataset staging --tag next
`

const deleteGraphQLAPICommand: CliCommandDefinition = {
  name: 'undeploy',
  group: 'graphql',
  signature: '',
  description: 'Remove a deployed GraphQL API',
  action: lazyRequire(require.resolve('../../actions/graphql/deleteApiAction')),
  helpText,
}

export default deleteGraphQLAPICommand
