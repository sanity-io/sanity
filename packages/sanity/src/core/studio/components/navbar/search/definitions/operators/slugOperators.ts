import {SearchButtonValueString} from '../../components/filters/common/ButtonValue'
import {SearchFilterStringInput} from '../../components/filters/filter/inputs/String'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const slugOperators = {
  slugEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'is',
    type: 'slugEqual',
  }),
  slugMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'contains',
    type: 'slugMatches',
  }),
  slugNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'is not',
    type: 'slugNotEqual',
  }),
  slugNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath}.current match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'does not contain',
    type: 'slugNotMatches',
  }),
}
