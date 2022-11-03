import {OPERATORS} from '../definitions/operators'
import type {SearchFilter} from '../types'
import {getFilterInitialOperator} from './getFilterInitialOperator'

export function getFilterInitialValue(filter: SearchFilter) {
  const operatorType = getFilterInitialOperator(filter)
  if (operatorType) {
    return OPERATORS[operatorType].initialValue
  }
  return undefined
}
