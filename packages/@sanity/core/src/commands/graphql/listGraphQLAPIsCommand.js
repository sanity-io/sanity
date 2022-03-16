import {lazyRequire} from '@sanity/util/_internal'

const helpText = `
Examples
  sanity graphql list
`

export default {
  name: 'list',
  signature: '',
  group: 'graphql',
  description: 'Lists all the GraphQL endpoints deployed for this project',
  action: lazyRequire(require.resolve('../../actions/graphql/listApisAction')),
  helpText,
}
