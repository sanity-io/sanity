import {ButtonValueString} from '../../components/filters/common/ButtonValue'
import {FieldInputString} from '../../components/filters/filter/inputTypes/String'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const slugOperators = {
  slugEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is',
    type: 'slugEqual',
  }),
  slugMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'contains',
    type: 'slugMatches',
  }),
  slugNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}.current != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is not',
    type: 'slugNotEqual',
  }),
  slugNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: ButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath}.current match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'does not contain',
    type: 'slugNotMatches',
  }),
}
