import {arrayOperators} from './arrayOperators'
import {assetOperators} from './assetOperators'
import {booleanOperators} from './booleanOperators'
import {definedOperators} from './defineOperators'
import {dateOperators} from './dateOperators'
import {numberOperators} from './numberOperators'
import {referenceOperators} from './referenceOperators'
import {stringOperators} from './stringOperators'

export const searchOperators = {
  ...arrayOperators,
  ...assetOperators,
  ...booleanOperators,
  ...definedOperators,
  ...dateOperators,
  ...numberOperators,
  ...referenceOperators,
  ...stringOperators,
} as const

type DefaultOperators = typeof searchOperators
export type SearchOperatorType = keyof DefaultOperators

export const operatorDefinitions = Object.values(searchOperators)
