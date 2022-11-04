import sub from 'date-fns/sub'
import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
import {FieldInputBoolean} from '../../components/filters/filter/inputTypes/Boolean'
import {FieldInputDate} from '../../components/filters/filter/inputTypes/Date'
import {FieldInputDateLast} from '../../components/filters/filter/inputTypes/DateLast'
import {FieldInputDateRange} from '../../components/filters/filter/inputTypes/DateRange'
import {FieldInputNumber} from '../../components/filters/filter/inputTypes/Number'
import {FieldInputNumberRange} from '../../components/filters/filter/inputTypes/NumberRange'
import {FieldInputReference} from '../../components/filters/filter/inputTypes/Reference'
import {FieldInputString} from '../../components/filters/filter/inputTypes/String'
import type {OperatorDefinitions} from './types'

function toJSON(val: unknown): string {
  return JSON.stringify(val)
}

export const OPERATORS: OperatorDefinitions = {
  arrayCountEqual: {
    buttonLabel: 'has',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is',
  },
  arrayCountGt: {
    buttonLabel: 'has >',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity more than (>)',
  },
  arrayCountGte: {
    buttonLabel: 'has ≥',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity more than (≥)',
  },
  arrayCountLt: {
    buttonLabel: 'has <',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than (<)',
  },
  arrayCountLte: {
    buttonLabel: 'has ≤',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than (≤)',
  },
  arrayCountNotEqual: {
    buttonLabel: 'does not have',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is not',
  },
  assetEqual: {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputAsset,
    label: 'is',
  },
  booleanEqual: {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: true,
    inputComponent: FieldInputBoolean,
    label: 'is',
  },
  dateAfter: {
    buttonLabel: 'after',
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is before',
  },
  dateEqual: {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is',
  },
  dateLast: {
    buttonLabel: 'last',
    fn: ({fieldPath, value}) => {
      const timestampAgo = sub(new Date(), {
        days: value?.unit === 'days' ? value?.value || 0 : 0,
        months: value?.unit === 'months' ? value?.value || 0 : 0,
        years: value?.unit === 'years' ? value?.value || 0 : 0,
      }).toISOString()
      return timestampAgo && fieldPath
        ? `dateTime(${fieldPath}) > dateTime(${toJSON(timestampAgo)})`
        : null
    },
    initialValue: {
      unit: 'days',
      value: 7,
    },
    inputComponent: FieldInputDateLast,
    label: 'is in the last',
  },
  dateNotEqual: {
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is not',
  },
  dateRange: {
    buttonLabel: 'is between',
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: {
      max: null,
      min: null,
    },
    inputComponent: FieldInputDateRange,
    label: 'is between',
  },
  defined: {
    buttonLabel: 'not empty',
    fn: ({fieldPath}) => (fieldPath ? `defined(${fieldPath})` : null),
    initialValue: null,
    label: 'not empty',
  },
  notDefined: {
    buttonLabel: 'is empty',
    fn: ({fieldPath}) => (fieldPath ? `!defined(${fieldPath})` : null),
    initialValue: null,
    label: 'is empty',
  },
  numberEqual: {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is',
  },
  numberGt: {
    buttonLabel: '>',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'greater than (>)',
  },
  numberGte: {
    buttonLabel: '≥',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'greater than or equal to (≥)',
  },
  numberLt: {
    buttonLabel: '<',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than (<)',
  },
  numberLte: {
    buttonLabel: '≤',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than or equal to (≤)',
  },
  numberNotEqual: {
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is not',
  },
  numberRange: {
    buttonLabel: 'is between',
    inputComponent: FieldInputNumberRange,
    initialValue: {max: null, min: null},
    fn: ({fieldPath, value}) => {
      return value?.max && value?.min && fieldPath
        ? `${fieldPath} > ${toJSON(value.min)} && ${fieldPath} < ${toJSON(value.max)}`
        : ''
    },
    label: 'is between',
  },
  referenceEqual: {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}._ref == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is',
  },
  references: {
    buttonLabel: 'references document',
    fn: ({value}) => (value ? `references(${toJSON(value)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'references document',
  },
  stringEqual: {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is',
  },
  stringMatches: {
    buttonLabel: 'contains',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'contains',
  },
  stringNotEqual: {
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is not',
  },
  stringNotMatches: {
    buttonLabel: 'does not contain',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `!(${fieldPath} match ${toJSON(value)})` : null,
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'does not contain',
  },
}
