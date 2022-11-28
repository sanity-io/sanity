import {SearchButtonValueString} from '../../components/filters/common/ButtonValue'
import {SearchFilterStringInput} from '../../components/filters/filter/inputs/String'
import {defineSearchOperator} from './operatorTypes'
import {toJSON} from './operatorUtils'

export const portableTextOperators = {
  portableTextEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'is',
    type: 'portableTextEqual',
  }),
  portableTextMatches: defineSearchOperator({
    buttonLabel: 'contains',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) match ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'contains',
    type: 'portableTextMatches',
  }),
  portableTextNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `pt::text(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'is not',
    type: 'portableTextNotEqual',
  }),
  portableTextNotMatches: defineSearchOperator({
    buttonLabel: 'does not contain',
    buttonValueComponent: SearchButtonValueString,
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(pt::text(${fieldPath}) match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: SearchFilterStringInput,
    label: 'does not contain',
    type: 'portableTextNotMatches',
  }),
}
