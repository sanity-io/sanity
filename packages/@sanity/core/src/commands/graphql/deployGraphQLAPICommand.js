import lazyRequire from '@sanity/util/lib/lazyRequire'

const helpText = `
Options
  --dataset <dataset> Deploy API for the given dataset
  --tag <tag> Deploy API to given tag (defaults to 'default')
  --generation <generation> API generation to deploy (defaults to 'gen2')
  --playground Deploy a GraphQL playground for easily testing queries (public)
  --no-playground Skip playground prompt (do not deploy a playground)
  --force Deploy API without confirming breaking changes

Examples
  sanity graphql deploy
  sanity graphql deploy --playground
  sanity graphql deploy --generation gen1
  sanity graphql deploy --dataset staging --no-playground
  sanity graphql deploy --dataset staging --tag next --no-playground
  sanity graphql deploy --no-playground --force
`

export default {
  name: 'deploy',
  signature: '',
  group: 'graphql',
  description: 'Deploy a GraphQL API from the current Sanity schema',
  action: lazyRequire(require.resolve('../../actions/graphql/deployApiAction')),
  helpText,
}
