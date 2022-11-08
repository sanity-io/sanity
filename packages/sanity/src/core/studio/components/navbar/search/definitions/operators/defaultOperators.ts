import {arrayOperators} from './arrayOperators'
import {assetOperators} from './assetOperators'
import {booleanOperators} from './booleanOperators'
import {definedOperators} from './defineOperators'
import {dateOperators} from './dateOperators'
import {numberOperators} from './numberOperators'
import {portableTextOperators} from './portableTextOperators'
import {referenceOperators} from './referenceOperators'
import {stringOperators} from './stringOperators'

const searchOperators = {
  ...arrayOperators,
  ...assetOperators,
  ...booleanOperators,
  ...definedOperators,
  ...dateOperators,
  ...numberOperators,
  ...portableTextOperators,
  ...referenceOperators,
  ...stringOperators,
}

type DefaultOperators = typeof searchOperators

/**
 * @alpha
 */
export type SearchOperatorType = keyof DefaultOperators

/**
 * @internal
 */
export const operatorDefinitions = Object.values(searchOperators)
