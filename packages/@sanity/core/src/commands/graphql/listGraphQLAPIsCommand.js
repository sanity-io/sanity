import {dynamicRequire} from '@sanity/util/_internal'

const helpText = `
Examples
  sanity graphql list
`

export default {
  name: 'list',
  signature: '',
  group: 'graphql',
  description: 'Lists all the GraphQL endpoints deployed for this project',
  action: (...args) => {
    const {listGraphQLApis} = dynamicRequire(
      require.resolve('../../actions/graphql/listApisAction')
    )
    listGraphQLApis(...args)
  },
  helpText,
}
