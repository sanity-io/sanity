import {format, isValid, sub} from 'date-fns'
import {typed} from '@sanity/types'
import {FieldInputDateLast} from '../../components/filters/filter/inputTypes/DateLast'
import {FieldInputDate} from '../../components/filters/filter/inputTypes/Date'
import {FieldInputDateTime} from '../../components/filters/filter/inputTypes/DateTime'
import {FieldInputDateRange} from '../../components/filters/filter/inputTypes/DateRange'
import {toJSON} from './operatorUtils'
import {defineSearchOperator, SearchOperatorParams} from './operatorTypes'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

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
    initialValue: null,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    initialValue: null,
    label: 'is before',
  },
  dateEqual: {
    buttonLabel: 'is',
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null
    },
    initialValue: null,
    label: 'is',
  },
  dateNotEqual: {
    buttonLabel: 'is not',
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null
    },
    initialValue: null,
    label: 'is not',
  },
  // TODO:
  dateRange: {
    buttonLabel: 'is between',
    buttonValue: (value: OperatorDateRangeValue) => {
      return value?.max && value?.min ? `${value.min} → ${value.max}` : null
    },
    fn: ({fieldPath, value}: SearchOperatorParams<OperatorDateRangeValue>) => ``,
    initialValue: typed<OperatorDateRangeValue>({
      max: null,
      min: null,
    }),
    label: 'is between',
  },
}

export const dateOperators = {
  dateAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    buttonValue: (value) => buttonDateValue({value}),
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null
    },
    inputComponent: FieldInputDate,
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    buttonValue: (value) => buttonDateValue({value}),
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null
    },
    inputComponent: FieldInputDate,
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    buttonValue: (value) => buttonDateValue({value}),
    inputComponent: FieldInputDate,
    type: 'dateEqual',
  }),
  dateLast: defineSearchOperator({
    buttonLabel: 'last',
    buttonValue: (value) => (value.value && value.unit ? `${value.value} ${value.unit}` : null),
    fn: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const timestampAgo = sub(new Date(), {
        days: value?.unit === 'days' ? value?.value || 0 : 0,
        months: value?.unit === 'months' ? value?.value || 0 : 0,
        years: value?.unit === 'years' ? value?.value || 0 : 0,
      }).toISOString()
      return timestampAgo && fieldPath ? `${fieldPath} > ${toJSON(timestampAgo)}` : null
    },
    inputComponent: FieldInputDateLast,
    initialValue: {
      unit: 'days',
      value: 7,
    },
    label: 'is in the last',
    type: 'dateLast',
  }),
  dateNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    buttonValue: (value) => buttonDateValue({value}),
    inputComponent: FieldInputDate,
    type: 'dateNotEqual',
  }),
  dateRange: defineSearchOperator({
    ...COMMON.dateRange,
    inputComponent: FieldInputDateRange,
    type: 'dateRange',
  }),
  dateTimeAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    buttonValue: (value) => buttonDateValue({value}),
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) > dateTime(${toJSON(value)})` : null
    },
    inputComponent: FieldInputDateTime,
    label: 'is after',
    type: 'dateTimeAfter',
  }),
  dateTimeBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    buttonValue: (value) => buttonDateValue({value}),
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) < dateTime(${toJSON(value)})` : null
    },
    inputComponent: FieldInputDateTime,
    type: 'dateTimeBefore',
  }),
  dateTimeEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    buttonValue: (value) => buttonDateValue({value}),
    inputComponent: FieldInputDateTime,
    type: 'dateTimeEqual',
  }),
  dateTimeLast: defineSearchOperator({
    buttonLabel: 'last',
    buttonValue: (value) => (value.value && value.unit ? `${value.value} ${value.unit}` : null),
    fn: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const timestampAgo = sub(new Date(), {
        days: value?.unit === 'days' ? value?.value || 0 : 0,
        months: value?.unit === 'months' ? value?.value || 0 : 0,
        years: value?.unit === 'years' ? value?.value || 0 : 0,
      }).toISOString()
      return timestampAgo && fieldPath
        ? `dateTime(${fieldPath}) > dateTime(${toJSON(timestampAgo)})`
        : null
    },
    inputComponent: FieldInputDateLast,
    initialValue: {
      unit: 'days',
      value: 7,
    },
    label: 'is in the last',
    type: 'dateTimeLast',
  }),
  dateTimeNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    buttonValue: (value) => buttonDateValue({value}),
    inputComponent: FieldInputDateTime,
    type: 'dateTimeNotEqual',
  }),
  dateTimeRange: defineSearchOperator({
    ...COMMON.dateRange,
    inputComponent: FieldInputDateRange,
    type: 'dateTimeRange',
  }),
}

function buttonDateValue({value}: {value: string}) {
  const date = value ? new Date(value) : null
  return date && isValid(date) ? format(date, DEFAULT_DATE_FORMAT) : null
}
