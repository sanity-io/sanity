import type {SearchOperator, SearchOperatorType} from '../types'

export const OPERATORS: Record<SearchOperatorType, SearchOperator> = {
  countEqualTo: {
    buttonLabel: 'Quantity',
    fn: (value, field) => (value && field ? `count(${field}) == ${value}` : null),
    label: 'quantity',
  },
  countGreaterThan: {
    buttonLabel: 'Quantity >',
    fn: (value, field) => (value && field ? `count(${field}) > ${value}` : null),
    label: 'quantity more than',
  },
  countLessThan: {
    buttonLabel: 'Quantity <',
    fn: (value, field) => (value && field ? `count(${field}) < ${value}` : null),
    label: 'quantity less than',
  },
  dateAfter: {
    buttonLabel: 'After',
    fn: (_value, _field) => `// TODO`,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'Before',
    fn: (_value, _field) => `// TODO`,
    label: 'is before',
  },
  dateLast: {
    buttonLabel: 'Last',
    fn: (_value, _field) => `// TODO`,
    label: 'is in the last',
  },
  dateRange: {
    buttonLabel: '', // not used
    fn: (_value, _field) => `// TODO`,
    label: 'is between',
  },
  empty: {
    buttonLabel: 'Empty',
    fn: (_value, field) => (field ? `!defined(${field})` : null),
    label: 'is empty',
  },
  equalTo: {
    buttonLabel: 'Exactly',
    fn: (value, field) => (value && field ? `${field} == ${value}` : null),
    label: 'is',
  },
  greaterThan: {
    buttonLabel: 'More than',
    fn: (value, field) => (value && field ? `${field} > ${value}` : null),
    label: 'is more than',
  },
  greaterThanOrEqualTo: {
    buttonLabel: 'More than or equal to',
    fn: (value, field) => (value && field ? `${field} >= ${value}` : null),
    label: 'is more than or equal to',
  },
  lessThan: {
    buttonLabel: 'Less than',
    fn: (value, field) => (value && field ? `${field} < ${value}` : null),
    label: 'is less than',
  },
  lessThanOrEqualTo: {
    buttonLabel: 'Less than or equal to',
    fn: (value, field) => (value && field ? `${field} <= ${value}` : null),
    label: 'is less than or equal to',
  },
  matches: {
    buttonLabel: 'contains',
    fn: (value, field) => (value && field ? `${field} match ${value}` : null),
    label: 'contains',
  },
  notEmpty: {
    buttonLabel: 'Not empty',
    fn: (_value, field) => (field ? `defined(${field})` : null),
    label: 'is not empty',
  },
  notEqualTo: {
    buttonLabel: 'Not',
    fn: (value, field) => (value && field ? `${field} != ${value}` : null),
    label: 'is not',
  },
  notMatches: {
    buttonLabel: 'Not',
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
