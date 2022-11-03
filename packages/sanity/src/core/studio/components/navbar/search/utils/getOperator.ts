import {OPERATORS} from '../definitions/operators'
import {OperatorDefinitions, SearchOperatorType} from '../definitions/operators/types'

export function getOperator(
  operatorType: SearchOperatorType
): OperatorDefinitions[SearchOperatorType] {
  return OPERATORS[operatorType]
}
