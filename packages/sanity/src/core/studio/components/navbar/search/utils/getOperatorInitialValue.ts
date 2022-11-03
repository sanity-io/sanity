import {OPERATORS} from '../definitions/operators'
import {SearchOperatorType} from '../definitions/operators/types'

export function getOperatorInitialValue(operatorType: SearchOperatorType) {
  return OPERATORS[operatorType].initialValue
}
