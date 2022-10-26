import type {SearchOperator, SearchOperatorType} from '../types'

export const OPERATORS: Record<SearchOperatorType, SearchOperator> = {
  dateAfter: {
    buttonLabel: 'after',
    fn: (_value, _field) => `// TODO`,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    fn: (_value, _field) => `// TODO`,
    label: 'is before',
  },
  dateLast: {
    buttonLabel: 'last',
    fn: (_value, _field) => `// TODO`,
    label: 'is in the last',
  },
  dateRange: {
    buttonLabel: '', // not used
    fn: (_value, field) => (field ? `${field} < foo` : null),
    label: 'is between',
  },
  empty: {
    buttonLabel: 'is empty',
    fn: (_value, field) => (field ? `!defined(${field})` : null),
    label: 'is empty',
  },
  equalTo: {
    buttonLabel: '=',
    fn: (value, field) => (value && field ? `${field} == ${value}` : null),
    label: 'equal to',
  },
  greaterThan: {
    buttonLabel: '>',
    fn: (value, field) => (value && field ? `${field} > ${value}` : null),
    label: 'greater than',
  },
  greaterThanOrEqualTo: {
    buttonLabel: '≥',
    fn: (value, field) => (value && field ? `${field} >= ${value}` : null),
    label: 'greater than or equal to',
  },
  lessThan: {
    buttonLabel: '<',
    fn: (value, field) => (value && field ? `${field} < ${value}` : null),
    label: 'less than',
  },
  lessThanOrEqualTo: {
    buttonLabel: '≤',
    fn: (value, field) => (value && field ? `${field} <= ${value}` : null),
    label: 'less than or equal to',
  },
  matches: {
    buttonLabel: 'includes',
    fn: (value, field) => (value && field ? `${field} match ${value}` : null),
    label: 'includes',
  },
  notEmpty: {
    buttonLabel: 'is not empty',
    fn: (_value, field) => (field ? `defined(${field})` : null),
    label: 'is not empty',
  },
  notEqualTo: {
    buttonLabel: '≠',
    fn: (value, field) => (value && field ? `${field} != ${value}` : null),
    label: 'not equal to',
  },
  numberRange: {
    buttonLabel: '', // not used
    // TODO: type correctly
    fn: (value, field) => {
      const parsed = JSON.parse(value)
      return parsed?.max && parsed?.min && field
        ? `${field} > ${parsed.min} && ${field} < ${parsed.max}`
        : ''
    },

    label: 'is between',
  },
}
