const lazyRequire = require('@sanity/util/lib/lazyRequire')

export default {
  name: 'delete',
  group: 'graphql',
  description: 'Delete a deployed GraphQL API',
  action: lazyRequire(require.resolve('../../actions/graphql/deleteApiAction')),
  hideFromHelp: true
}
