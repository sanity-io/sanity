import lazyRequire from '@sanity/util/lib/lazyRequire'

export default {
  name: 'undeploy',
  group: 'graphql',
  description: 'Remove a deployed GraphQL API',
  action: lazyRequire(require.resolve('../../actions/graphql/deleteApiAction')),
  hideFromHelp: true
}
