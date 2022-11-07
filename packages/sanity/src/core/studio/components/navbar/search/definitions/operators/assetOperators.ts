import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
import {toJSON} from './operatorUtils'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'

export const assetOperators = {
  assetEqual: defineSearchOperator({
    buttonLabel: 'is',
    fn: ({fieldPath, value}: SearchOperatorParams<unknown>) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputAsset,
    label: 'is',
    type: 'assetEqual',
  }),
} as const
