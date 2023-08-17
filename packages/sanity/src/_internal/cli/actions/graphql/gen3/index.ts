import util from 'util'

import {isUnion} from '../helpers'
import type {
  ApiSpecification,
  ConvertedType,
  GeneratedApiSpecification,
  InputObjectType,
} from '../types'
import {generateTypeFilters} from './generateTypeFilters'
import {generateTypeSortings} from './generateTypeSortings'
import {generateTypeQueries} from './generateTypeQueries'

export default (extracted: ApiSpecification): GeneratedApiSpecification => {
  const documentInterface = extracted.interfaces.find((iface) => iface.name === 'Document')
  if (!documentInterface || isUnion(documentInterface)) {
    throw new Error('Failed to find document interface')
  }

  const types = [...extracted.types, documentInterface as ConvertedType]

  const filters = generateTypeFilters(types)
  const sortings = generateTypeSortings(types)
  const queries = generateTypeQueries(
    types,
    sortings.filter((node): node is InputObjectType => node.kind === 'InputObject'),
  )
  const graphqlTypes = [...extracted.types, ...filters, ...sortings]

  return {types: graphqlTypes, queries, interfaces: extracted.interfaces, generation: 'gen3'}
}
