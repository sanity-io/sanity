import type {SearchOperator, SearchOperatorType} from '../types'

export const OPERATORS: Record<SearchOperatorType, SearchOperator> = {
  dateAfter: {
    buttonLabel: 'after',
    fn: (_value, _field) => ``,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    fn: (_value, _field) => ``,
    label: 'is before',
  },
  dateLast: {
    buttonLabel: 'last',
    fn: (_value, _field) => ``,
    label: 'is in the last',
  },
  dateRange: {
    buttonLabel: 'is between', // TODO: re-think
    fn: (_value, _field) => ``,
    label: 'is between',
  },
  defined: {
    buttonLabel: 'is not empty',
    fn: (_value, field) => `defined(${field})`,
    label: 'is not empty',
  },
  equalTo: {
    buttonLabel: '=',
    fn: (value, field) => `${field} == ${value}`,
    label: 'equal to',
  },
  greaterThan: {
    buttonLabel: '>',
    fn: (value, field) => `${field} > ${value}`,
    label: 'greater than',
  },
  greaterThanOrEqualTo: {
    buttonLabel: '≥',
    fn: (value, field) => `${field} >= ${value}`,
    label: 'greater than or equal to',
  },
  lessThan: {
    buttonLabel: '<',
    fn: (value, field) => `${field} < ${value}`,
    label: 'less than',
  },
  lessThanOrEqualTo: {
    buttonLabel: '≤',
    fn: (value, field) => `${field} <= ${value}`,
    label: 'less than or equal to',
  },
  matches: {
    buttonLabel: 'includes',
    fn: (_value, _field) => ``,
    label: 'includes',
  },
  notDefined: {
    buttonLabel: 'is empty',
    fn: (_value, field) => `defined(${field})`,
    label: 'is empty',
  },
  notEqualTo: {
    buttonLabel: '≠',
    fn: (value, field) => `${field} != ${value}`,
    label: 'not equal to',
  },
  numberRange: {
    buttonLabel: 'is between', // TODO: re-think
    fn: (_value, _field) => ``,
    label: 'is between',
  },
}
