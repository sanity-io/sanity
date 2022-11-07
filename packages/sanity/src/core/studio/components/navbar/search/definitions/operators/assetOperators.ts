import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export const assetOperators = {
  assetEqual: defineSearchOperator({
    buttonLabel: 'is',
    fn: ({fieldPath, value}: {fieldPath?: string; value?: unknown}) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null as unknown,
    inputComponent: FieldInputAsset,
    label: 'is',
    type: 'assetEqual',
  }),
} as const
