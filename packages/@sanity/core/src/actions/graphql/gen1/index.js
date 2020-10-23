const generateTypeFilters = require('./generateTypeFilters')
const generateTypeQueries = require('./generateTypeQueries')

module.exports = (extracted) => {
  const filters = generateTypeFilters(extracted.types)
  const queries = generateTypeQueries(extracted.types, filters)
  const types = extracted.types.concat(filters)
  return {types, queries, interfaces: extracted.interfaces, generation: 'gen1'}
}
