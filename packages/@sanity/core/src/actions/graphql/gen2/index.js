const generateTypeFilters = require('./generateTypeFilters')
const generateTypeSortings = require('./generateTypeSortings')
const generateTypeQueries = require('./generateTypeQueries')

module.exports = (extracted) => {
  const types = [...extracted.types, extracted.interfaces.find((i) => i.name === 'Document')]

  const filters = generateTypeFilters(types)
  const sortings = generateTypeSortings(types)
  const queries = generateTypeQueries(types, sortings)
  const graphqlTypes = extracted.types.concat(filters).concat(sortings)

  return {types: graphqlTypes, queries, interfaces: extracted.interfaces, generation: 'gen2'}
}
