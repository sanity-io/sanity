import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Options
  --dataset <dataset> Delete GraphQL API for the given dataset
  --tag <tag> Delete GraphQL API for the given tag (defaults to 'default')
  --force Skip confirmation prompt, forcefully undeploying the GraphQL API

Examples
  sanity graphql undeploy
  sanity graphql undeploy --dataset staging
  sanity graphql undeploy --dataset staging --tag next
  sanity graphql undeploy --dataset staging --force
`

export default {
  name: 'undeploy',
  group: 'graphql',
  description: 'Remove a deployed GraphQL API',
  action: lazyRequire(require.resolve('../../actions/graphql/deleteApiAction')),
  helpText,
}
