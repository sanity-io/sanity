import type {ApiSpecification, GeneratedApiSpecification, InputObjectType} from '../types'
import {generateTypeFilters} from './generateTypeFilters'
import {generateTypeSortings} from './generateTypeSortings'
import {generateTypeQueries} from './generateTypeQueries'

export default (extracted: ApiSpecification): GeneratedApiSpecification => {
  const filters = generateTypeFilters(extracted.types)
  const sortings = generateTypeSortings(extracted.types)
  const queries = generateTypeQueries(
    extracted.types,
    sortings.filter((node): node is InputObjectType => node.kind === 'InputObject'),
  )
  const types = [...extracted.types, ...filters, ...sortings]

  return {types, queries, interfaces: extracted.interfaces, generation: 'gen2'}
}
