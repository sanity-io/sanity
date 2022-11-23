import {ButtonValueAsset} from '../../components/filters/common/ButtonValue'
import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const assetOperators = {
  assetEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueAsset,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) =>
      value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputAsset,
    label: 'is',
    type: 'assetEqual',
  }),
}
