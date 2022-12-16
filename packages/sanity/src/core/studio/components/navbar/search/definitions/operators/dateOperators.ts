import {startOfToday, sub} from 'date-fns'
import {
  SearchButtonValueDate,
  SearchButtonValueDateLast,
  SearchButtonValueDateRange,
} from '../../components/filters/common/ButtonValue'
import {SearchFilterDateInput} from '../../components/filters/filter/inputs/date/Date'
import {SearchFilterDateLastInput} from '../../components/filters/filter/inputs/date/DateLast'
import {SearchFilterDateRangeInput} from '../../components/filters/filter/inputs/date/DateRange'
import {SearchFilterDateTimeInput} from '../../components/filters/filter/inputs/date/DateTime'
import {SearchFilterDateTimeRangeInput} from '../../components/filters/filter/inputs/date/DateTimeRange'
import {
  defineSearchOperator,
  SearchOperatorButtonValue,
  SearchOperatorInput,
  SearchOperatorParams,
} from './operatorTypes'
import {toJSON} from './operatorUtils'

export interface OperatorDateRangeValue {
  max: string | null
  min: string | null
}

export interface OperatorDateLastValue {
  unit: 'days' | 'months' | 'years'
  value: number | null
}

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors

// Common values shared between date & datetime defs
const COMMON = {
  dateAfter: {
    buttonLabel: 'after',
    buttonValueComponent: SearchButtonValueDate as SearchOperatorButtonValue<string>,
    initialValue: null,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    buttonValueComponent: SearchButtonValueDate as SearchOperatorButtonValue<string>,
    initialValue: null,
    label: 'is before',
  },
  dateEqual: {
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueDate as SearchOperatorButtonValue<string>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null
    },
    initialValue: null,
    label: 'is',
  },
  dateLast: {
    buttonLabel: 'last',
    buttonValueComponent:
      SearchButtonValueDateLast as SearchOperatorButtonValue<OperatorDateLastValue>,
    label: 'is in the last',
  },
  dateNotEqual: {
    buttonLabel: 'is not',
    buttonValueComponent: SearchButtonValueDate as SearchOperatorButtonValue<string>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null
    },
    initialValue: null,
    label: 'is not',
  },
  dateRange: {
    buttonLabel: 'is between',
    initialValue: null,
    label: 'is between',
  },
}

export const dateOperators = {
  dateAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null
    },
    inputComponent: SearchFilterDateInput as SearchOperatorInput<string>,
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null
    },
    inputComponent: SearchFilterDateInput as SearchOperatorInput<string>,
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    inputComponent: SearchFilterDateInput as SearchOperatorInput<string>,
    type: 'dateEqual',
  }),
  dateLast: defineSearchOperator({
    ...COMMON.dateLast,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
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
    inputComponent: SearchFilterDateLastInput as SearchOperatorInput<OperatorDateLastValue>,
    initialValue: {
      unit: 'days',
      value: 7,
    },
    type: 'dateLast',
  }),
  dateNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    inputComponent: SearchFilterDateInput as SearchOperatorInput<string>,
    type: 'dateNotEqual',
  }),
  dateRange: defineSearchOperator({
    ...COMMON.dateRange,
    buttonValueComponent:
      SearchButtonValueDateRange as SearchOperatorButtonValue<OperatorDateRangeValue>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateRangeValue>) => {
      return value?.max && value?.min && fieldPath
        ? `${fieldPath} >= ${toJSON(value.min)} && ${fieldPath} <= ${toJSON(value.max)}`
        : null
    },
    initialValue: {
      max: startOfToday().toISOString(),
      min: null,
    },
    inputComponent: SearchFilterDateRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateRange',
  }),
  dateTimeAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) > dateTime(${toJSON(value)})` : null
    },
    inputComponent: SearchFilterDateTimeInput as SearchOperatorInput<string>,
    type: 'dateTimeAfter',
  }),
  dateTimeBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) < dateTime(${toJSON(value)})` : null
    },
    inputComponent: SearchFilterDateTimeInput as SearchOperatorInput<string>,
    type: 'dateTimeBefore',
  }),
  dateTimeEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    inputComponent: SearchFilterDateTimeInput as SearchOperatorInput<string>,
    type: 'dateTimeEqual',
  }),
  dateTimeLast: defineSearchOperator({
    ...COMMON.dateLast,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
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
    inputComponent: SearchFilterDateLastInput as SearchOperatorInput<OperatorDateLastValue>,
    type: 'dateTimeLast',
  }),
  dateTimeNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    inputComponent: SearchFilterDateTimeInput as SearchOperatorInput<string>,
    type: 'dateTimeNotEqual',
  }),
  dateTimeRange: defineSearchOperator({
    ...COMMON.dateRange,
    buttonValueComponent:
      SearchButtonValueDateRange as SearchOperatorButtonValue<OperatorDateRangeValue>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateRangeValue>) => {
      return value?.max && value?.min && fieldPath
        ? `dateTime(${fieldPath}) >= dateTime(${toJSON(
            value.min
          )}) && dateTime(${fieldPath}) <= dateTime(${toJSON(value.max)})`
        : null
    },
    initialValue: {
      max: startOfToday().toISOString(),
      min: null,
    },
    inputComponent: SearchFilterDateTimeRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateTimeRange',
  }),
}
