import {startOfToday, sub} from 'date-fns'
import {
  SearchButtonValueDate,
  SearchButtonValueDateDirection,
  SearchButtonValueDateLast,
  SearchButtonValueDateRange,
} from '../../components/filters/common/ButtonValue'
import {SearchFilterDateEqualInput} from '../../components/filters/filter/inputs/date/DateEqual'
import {SearchFilterDateAfterInput} from '../../components/filters/filter/inputs/date/DateAfter'
import {SearchFilterDateBeforeInput} from '../../components/filters/filter/inputs/date/DateBefore'
import {SearchFilterDateLastInput} from '../../components/filters/filter/inputs/date/DateLast'
import {SearchFilterDateRangeInput} from '../../components/filters/filter/inputs/date/DateRange'
import {SearchFilterDateTimeEqualInput} from '../../components/filters/filter/inputs/date/DateTimeEqual'
import {SearchFilterDateTimeAfterInput} from '../../components/filters/filter/inputs/date/DateTimeAfter'
import {SearchFilterDateTimeBeforeInput} from '../../components/filters/filter/inputs/date/DateTimeBefore'
import {SearchFilterDateTimeRangeInput} from '../../components/filters/filter/inputs/date/DateTimeRange'
import {
  defineSearchOperator,
  SearchOperatorButtonValue,
  SearchOperatorInput,
  SearchOperatorParams,
} from './operatorTypes'
import {toJSON} from './operatorUtils'

// 'Before' and 'after' dates
export interface OperatorDateDirectionValue {
  includeTime?: boolean
  value: string | null
}

export interface OperatorDateRangeValue {
  includeTime?: boolean
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
    buttonValueComponent:
      SearchButtonValueDateDirection as SearchOperatorButtonValue<OperatorDateDirectionValue>,
    initialValue: null,
    label: 'is after',
  },
  dateBefore: {
    buttonLabel: 'before',
    buttonValueComponent:
      SearchButtonValueDateDirection as SearchOperatorButtonValue<OperatorDateDirectionValue>,
    initialValue: null,
    label: 'is before',
  },
  dateEqual: {
    buttonLabel: 'is',
    buttonValueComponent: SearchButtonValueDate as SearchOperatorButtonValue<string>,
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
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.value && fieldPath ? `${fieldPath} > ${toJSON(value?.value)}` : null
    },
    inputComponent: SearchFilterDateAfterInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.value && fieldPath ? `${fieldPath} < ${toJSON(value?.value)}` : null
    },
    inputComponent: SearchFilterDateBeforeInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null
    },
    inputComponent: SearchFilterDateEqualInput as SearchOperatorInput<string>,
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
          })
            .toISOString()
            .split('T')[0] // only include date
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
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null
    },
    inputComponent: SearchFilterDateEqualInput as SearchOperatorInput<string>,
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
      includeTime: false,
      max: startOfToday().toISOString(),
      min: null,
    },
    inputComponent: SearchFilterDateRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateRange',
  }),
  dateTimeAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.value && fieldPath
        ? `dateTime(${fieldPath}) > dateTime(${toJSON(value.value)})`
        : null
    },
    inputComponent:
      SearchFilterDateTimeAfterInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateTimeAfter',
  }),
  dateTimeBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.value && fieldPath
        ? `dateTime(${fieldPath}) < dateTime(${toJSON(value.value)})`
        : null
    },
    inputComponent:
      SearchFilterDateTimeBeforeInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateTimeBefore',
  }),
  dateTimeEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) == dateTime(${toJSON(value)})` : null
    },
    inputComponent: SearchFilterDateTimeEqualInput as SearchOperatorInput<string>,
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
    groqFilter: ({fieldPath, value}: SearchOperatorParams<string>) => {
      return value && fieldPath ? `dateTime(${fieldPath}) != dateTime(${toJSON(value)})` : null
    },
    inputComponent: SearchFilterDateTimeEqualInput as SearchOperatorInput<string>,
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
      includeTime: false,
      max: startOfToday().toISOString(),
      min: null,
    },
    inputComponent: SearchFilterDateTimeRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateTimeRange',
  }),
}
