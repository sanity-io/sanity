import {sub} from 'date-fns'
import {
  SearchButtonValueDate,
  SearchButtonValueLast,
} from '../../components/filters/common/ButtonValue'
import {SearchFilterDateInput} from '../../components/filters/filter/inputs/date/Date'
import {SearchFilterDateLastInput} from '../../components/filters/filter/inputs/date/DateLast'
import {SearchFilterDateTimeInput} from '../../components/filters/filter/inputs/date/DateTime'
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
    buttonValueComponent: SearchButtonValueDate,
    initialValue: null,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    buttonValueComponent: SearchButtonValueDate,
    initialValue: null,
    label: 'is before',
  },
  dateEqual: {
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueDate,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null
    },
    initialValue: null,
    label: 'is',
  },
  dateLast: {
    buttonLabel: 'last',
    buttonValueComponent: SearchButtonValueLast,
    label: 'is in the last',
  },
  dateNotEqual: {
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueDate,
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
    inputComponent: SearchFilterDateInput,
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null
    },
    inputComponent: SearchFilterDateInput,
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    inputComponent: SearchFilterDateInput,
    type: 'dateEqual',
  }),
  dateLast: defineSearchOperator({
    ...COMMON.dateLast,
    fn: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue = typeof value?.value === 'number' ? Math.floor(value.value) : undefined
      const timestampAgo = Number.isFinite(flooredValue)
        ? sub(new Date(), {
            days: value?.unit === 'days' ? flooredValue : 0,
            months: value?.unit === 'months' ? flooredValue : 0,
            years: value?.unit === 'years' ? flooredValue : 0,
          }).toISOString()
        : null
      return timestampAgo && fieldPath ? `${fieldPath} > ${toJSON(timestampAgo)}` : null
    },
    inputComponent: SearchFilterDateLastInput,
    initialValue: {
      unit: 'days',
      value: 7,
    },
    type: 'dateLast',
  }),
  dateNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    inputComponent: SearchFilterDateInput,
    type: 'dateNotEqual',
  }),
  dateTimeAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) > dateTime(${toJSON(value)})` : null
    },
    inputComponent: SearchFilterDateTimeInput,
    type: 'dateTimeAfter',
  }),
  dateTimeBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    fn: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) < dateTime(${toJSON(value)})` : null
    },
    inputComponent: SearchFilterDateTimeInput,
    type: 'dateTimeBefore',
  }),
  dateTimeEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    inputComponent: SearchFilterDateTimeInput,
    type: 'dateTimeEqual',
  }),
  dateTimeLast: defineSearchOperator({
    ...COMMON.dateLast,
    fn: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue = typeof value?.value === 'number' ? Math.floor(value.value) : undefined
      const timestampAgo = Number.isFinite(flooredValue)
        ? sub(new Date(), {
            days: value?.unit === 'days' ? flooredValue : 0,
            months: value?.unit === 'months' ? flooredValue : 0,
            years: value?.unit === 'years' ? flooredValue : 0,
          }).toISOString()
        : null
      return timestampAgo && fieldPath
        ? `dateTime(${fieldPath}) > dateTime(${toJSON(timestampAgo)})`
        : null
    },
    initialValue: {
      unit: 'days',
      value: 7,
    },
    inputComponent: SearchFilterDateLastInput,
    type: 'dateTimeLast',
  }),
  dateTimeNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    inputComponent: SearchFilterDateTimeInput,
    type: 'dateTimeNotEqual',
  }),
}
