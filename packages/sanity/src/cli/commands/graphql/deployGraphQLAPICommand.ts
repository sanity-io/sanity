import type {CliCommandDefinition} from '@sanity/cli'
import {lazyRequire} from '../../util/lazyRequire'

const helpText = `
Options
  --dry-run Validate defined APIs, exiting with an error on breaking changes
  --force Deploy API without confirming breaking changes
  --api <api-id> Only deploy API with this ID. Can be specified multiple times.

Examples
  # Deploy all defined GraphQL APIs
  sanity graphql deploy

  # Validate defined GraphQL APIs and check for breaking changes
  sanity graphql deploy --dry-run

  # Deploy only the GraphQL APIs with the IDs "staging" and "ios"
  sanity graphql deploy --api staging --api ios
`

const deployGraphQLAPICommand: CliCommandDefinition = {
  name: 'deploy',
  signature: '',
  group: 'graphql',
  description: 'Deploy a GraphQL API from the current Sanity schema',
  action: lazyRequire(require.resolve('../../actions/graphql/deployApiAction')),
  helpText,
}

export default deployGraphQLAPICommand
