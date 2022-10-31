import type {SearchOperator, SearchOperatorType} from '../types'

export const OPERATORS: Record<SearchOperatorType, SearchOperator> = {
  countEqualTo: {
    buttonLabel: 'has',
    fn: (value, field) => (value && field ? `count(${field}) == ${value}` : null),
    label: 'quantity equals',
  },
  countGreaterThan: {
    buttonLabel: 'has >',
    fn: (value, field) => (value && field ? `count(${field}) > ${value}` : null),
    label: 'quantity more than',
  },
  countLessThan: {
    buttonLabel: 'has <',
    fn: (value, field) => (value && field ? `count(${field}) < ${value}` : null),
    label: 'quantity less than',
  },
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
    buttonLabel: 'is better',
    fn: (_value, _field) => `// TODO`,
    label: 'is between',
  },
  empty: {
    buttonLabel: 'is empty',
    fn: (_value, field) => (field ? `!defined(${field})` : null),
    label: 'is empty',
  },
  equalTo: {
    buttonLabel: 'is',
    fn: (value, field) => (value && field ? `${field} == ${value}` : null),
    label: 'is',
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
    buttonLabel: 'contains',
    fn: (value, field) => (value && field ? `${field} match ${value}` : null),
    label: 'contains',
  },
  notEmpty: {
    buttonLabel: 'not empty',
    fn: (_value, field) => (field ? `defined(${field})` : null),
    label: 'not empty',
  },
  notEqualTo: {
    buttonLabel: 'is not',
    fn: (value, field) => (value && field ? `${field} != ${value}` : null),
    label: 'is not',
  },
  notMatches: {
    buttonLabel: 'does not contain',
    fn: (value, field) => (value && field ? `!(${field} match ${value})` : null),
    label: 'does not contain',
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
