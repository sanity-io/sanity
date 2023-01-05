import {arrayOperators} from './arrayOperators'
import {assetOperators} from './assetOperators'
import {booleanOperators} from './booleanOperators'
import {definedOperators} from './definedOperators'
import {dateOperators} from './dateOperators'
import {numberOperators} from './numberOperators'
import {portableTextOperators} from './portableTextOperators'
import {referenceOperators} from './referenceOperators'
import {slugOperators} from './slugOperators'
import {stringOperators} from './stringOperators'

const searchOperators = {
  ...arrayOperators,
  ...assetOperators,
  ...booleanOperators,
  ...dateOperators,
  ...definedOperators,
  ...numberOperators,
  ...portableTextOperators,
  ...referenceOperators,
  ...slugOperators,
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
