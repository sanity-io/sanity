import {defineSearchOperator} from './operatorTypes'

export const definedOperators = {
  defined: defineSearchOperator({
    nameKey: 'search.operator.defined.name',
    descriptionKey: 'search.operator.defined.description',

    groqFilter: ({fieldPath}) => (fieldPath ? `defined(${fieldPath})` : null),
    type: 'defined',
  }),
  notDefined: defineSearchOperator({
    nameKey: 'search.operator.not-defined.name',
    descriptionKey: 'search.operator.not-defined.description',

    i18nKey: 'search.operator.not-defined',
    groqFilter: ({fieldPath}) => (fieldPath ? `!defined(${fieldPath})` : null),
    type: 'notDefined',
  }),
}
