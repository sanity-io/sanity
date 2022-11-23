import {sub} from 'date-fns'
import {ButtonValueDate, ButtonValueLast} from '../../components/filters/common/ButtonValue'
import {FieldInputDate} from '../../components/filters/filter/inputTypes/Date'
import {FieldInputDateLast} from '../../components/filters/filter/inputTypes/DateLast'
import {FieldInputDateTime} from '../../components/filters/filter/inputTypes/DateTime'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'
import {toJSON} from './operatorUtils'

export interface OperatorDateRangeValue {
  max: Date | null
  min: Date | null
}

export interface OperatorDateLastValue {
  unit: 'days' | 'months' | 'years'
  value: number | null
}

// Common values shared between date & datetime defs
const COMMON = {
  dateAfter: {
    buttonLabel: 'after',
    buttonValueComponent: ButtonValueDate,
    initialValue: null,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    buttonValueComponent: ButtonValueDate,
    initialValue: null,
    label: 'is before',
  },
  dateEqual: {
    buttonLabel: 'is',
    buttonValueComponent: ButtonValueDate,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null
    },
    initialValue: null,
    label: 'is',
  },
  dateLast: {
    buttonLabel: 'last',
    buttonValueComponent: ButtonValueLast,
    label: 'is in the last',
  },
  dateNotEqual: {
    buttonLabel: 'is not',
    buttonValueComponent: ButtonValueDate,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null
    },
    initialValue: null,
    label: 'is not',
  },
}

export const dateOperators = {
  dateAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null
    },
    inputComponent: FieldInputDate,
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null
    },
    inputComponent: FieldInputDate,
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    inputComponent: FieldInputDate,
    type: 'dateEqual',
  }),
  dateLast: defineSearchOperator({
    ...COMMON.dateLast,
    fn: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue = Math.floor(value?.value ?? 0)
      const timestampAgo = sub(new Date(), {
        days: value?.unit === 'days' ? flooredValue : 0,
        months: value?.unit === 'months' ? flooredValue : 0,
        years: value?.unit === 'years' ? flooredValue : 0,
      }).toISOString()
      return timestampAgo && fieldPath ? `${fieldPath} > ${toJSON(timestampAgo)}` : null
    },
    inputComponent: FieldInputDateLast,
    initialValue: {
      unit: 'days',
      value: 7,
    },
    type: 'dateLast',
  }),
  dateNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    inputComponent: FieldInputDate,
    type: 'dateNotEqual',
  }),
  dateTimeAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) > dateTime(${toJSON(value)})` : null
    },
    inputComponent: FieldInputDateTime,
    type: 'dateTimeAfter',
  }),
  dateTimeBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) < dateTime(${toJSON(value)})` : null
    },
    inputComponent: FieldInputDateTime,
    type: 'dateTimeBefore',
  }),
  dateTimeEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    inputComponent: FieldInputDateTime,
    type: 'dateTimeEqual',
  }),
  dateTimeLast: defineSearchOperator({
    ...COMMON.dateLast,
    fn: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue = Math.floor(value?.value ?? 0)
      const timestampAgo = sub(new Date(), {
        days: value?.unit === 'days' ? flooredValue : 0,
        months: value?.unit === 'months' ? flooredValue : 0,
        years: value?.unit === 'years' ? flooredValue : 0,
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
    type: 'dateTimeLast',
  }),
  dateTimeNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    inputComponent: FieldInputDateTime,
    type: 'dateTimeNotEqual',
  }),
}
