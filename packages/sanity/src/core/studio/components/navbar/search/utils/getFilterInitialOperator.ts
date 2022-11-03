import {FILTERS} from '../definitions/filters'
import type {SearchOperatorType} from '../definitions/operators/types'
import type {SearchFilter} from '../types'

export function getFilterInitialOperator(filter: SearchFilter): SearchOperatorType {
  if (filter.type === 'custom') {
    return FILTERS[filter.type][filter.id].initialOperator
  }
  if (filter.type === 'field') {
    return FILTERS[filter.type][filter.fieldType].initialOperator
  }

  throw new Error('Unable to find filter')
}
