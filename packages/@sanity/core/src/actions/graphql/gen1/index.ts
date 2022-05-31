import {ApiSpecification, GeneratedApiSpecification} from '../types'
import {generateTypeFilters} from './generateTypeFilters'
import {generateTypeQueries} from './generateTypeQueries'

export default (extracted: ApiSpecification): GeneratedApiSpecification => {
  const filters = generateTypeFilters(extracted.types)
  const queries = generateTypeQueries(extracted.types, filters)
  const types = [...extracted.types, ...filters]
  return {types, queries, interfaces: extracted.interfaces, generation: 'gen1'}
}
