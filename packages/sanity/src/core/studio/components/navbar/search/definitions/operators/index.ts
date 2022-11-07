import {arrayOperators} from './arrayOperators'
import {stringOperators} from './stringOperators'
import {dateOperators} from './dateOperators'
import {referenceOperators} from './referenceOperators'
import {numberOperators} from './numberOperators'
import {definedOperators} from './defineOperators'
import {booleanOperators} from './booleanOperators'
import {assetOperators} from './assetOperators'

const OPERATORS = {
  ...arrayOperators,
  ...assetOperators,
  ...booleanOperators,
  ...definedOperators,
  ...dateOperators,
  ...numberOperators,
  ...referenceOperators,
  ...stringOperators,
} as const

type Operators = typeof OPERATORS
export type SearchOperatorType = keyof Operators
export type SearchOperator = Operators[SearchOperatorType]

export function getOperator<T extends SearchOperatorType>(
  operatorType?: T
): Operators[T] | undefined {
  return operatorType ? OPERATORS[operatorType] : undefined
}

export function getOperatorInitialValue<T extends SearchOperatorType>(
  operatorType: T
): Operators[T]['initialValue'] | undefined {
  return getOperator(operatorType)?.initialValue
}
