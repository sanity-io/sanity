import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Options
  --dataset <dataset> Deploy API for the given dataset
  --tag <tag> Deploy API to given tag (defaults to 'default')
  --playground Deploy a GraphQL playground for easily testing queries (public)
  --no-playground Skip playground prompt (do not deploy a playground)

Examples
  sanity graphql deploy
  sanity graphql deploy --playground
  sanity graphql deploy --dataset staging --no-playground
  sanity graphql deploy --dataset staging --tag next --no-playground
`

export default {
  name: 'deploy',
  signature: '',
  group: 'graphql',
  description: 'Deploy a GraphQL API from the current Sanity schema',
  action: lazyRequire(require.resolve('../../actions/graphql/deployApiAction')),
  helpText
}
