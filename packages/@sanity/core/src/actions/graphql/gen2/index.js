const generateTypeFilters = require('./generateTypeFilters')
const generateTypeSortings = require('./generateTypeSortings')
const generateTypeQueries = require('./generateTypeQueries')

module.exports = (extracted) => {
  const filters = generateTypeFilters(extracted.types)
  const sortings = generateTypeSortings(extracted.types)
  const queries = generateTypeQueries(extracted.types, filters, sortings)
  const types = extracted.types.concat(filters).concat(sortings)

  return {types, queries, interfaces: extracted.interfaces, generation: 'gen2'}
}
