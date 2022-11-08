import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
import {toJSON} from './operatorUtils'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'

export const assetOperators = {
  assetEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => (value ? value.slice(0, 8) : null),
    fn: ({fieldPath, value}: SearchOperatorParams<string>) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputAsset,
    label: 'is',
    type: 'assetEqual',
  }),
}
