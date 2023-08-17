import {
  endOfDay,
  endOfMinute,
  isValid,
  startOfDay,
  startOfMinute,
  startOfToday,
  sub,
} from 'date-fns'
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
  date: string | null
}

export interface OperatorDateEqualValue {
  includeTime?: boolean
  date: string | null
}

export interface OperatorDateRangeValue {
  dateMax: string | null
  dateMin: string | null
  includeTime?: boolean
}

export interface OperatorDateLastValue {
  unit: 'days' | 'months' | 'years'
  unitValue: number | null
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
    buttonValueComponent:
      SearchButtonValueDate as SearchOperatorButtonValue<OperatorDateEqualValue>,
    initialValue: {
      date: null,
      includeTime: false,
    },
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
    buttonValueComponent:
      SearchButtonValueDate as SearchOperatorButtonValue<OperatorDateEqualValue>,
    initialValue: {
      date: null,
      includeTime: false,
    },
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
      return value?.date && fieldPath ? `${fieldPath} > ${toJSON(value?.date)}` : null
    },
    inputComponent: SearchFilterDateAfterInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.date && fieldPath ? `${fieldPath} < ${toJSON(value?.date)}` : null
    },
    inputComponent: SearchFilterDateBeforeInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateEqualValue>) => {
      return value?.date && fieldPath ? `${fieldPath} == ${toJSON(value.date)}` : null
    },
    inputComponent: SearchFilterDateEqualInput as SearchOperatorInput<OperatorDateEqualValue>,
    type: 'dateEqual',
  }),
  dateLast: defineSearchOperator({
    ...COMMON.dateLast,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue =
        typeof value?.unitValue === 'number' ? Math.floor(value.unitValue) : undefined
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
      unitValue: 7,
    },
    type: 'dateLast',
  }),
  dateNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateEqualValue>) => {
      return value?.date && fieldPath ? `${fieldPath} != ${toJSON(value.date)}` : null
    },
    inputComponent: SearchFilterDateEqualInput as SearchOperatorInput<OperatorDateEqualValue>,
    type: 'dateNotEqual',
  }),
  dateRange: defineSearchOperator({
    ...COMMON.dateRange,
    buttonValueComponent:
      SearchButtonValueDateRange as SearchOperatorButtonValue<OperatorDateRangeValue>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateRangeValue>) => {
      return value?.dateMax && value?.dateMin && fieldPath
        ? `${fieldPath} >= ${toJSON(value.dateMin)} && ${fieldPath} <= ${toJSON(value.dateMax)}`
        : null
    },
    initialValue: {
      includeTime: false,
      dateMax: startOfToday().toISOString(),
      dateMin: null,
    },
    inputComponent: SearchFilterDateRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateRange',
  }),
  dateTimeAfter: defineSearchOperator({
    ...COMMON.dateAfter,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.date && fieldPath
        ? `dateTime(${fieldPath}) > dateTime(${toJSON(value.date)})`
        : null
    },
    inputComponent:
      SearchFilterDateTimeAfterInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateTimeAfter',
  }),
  dateTimeBefore: defineSearchOperator({
    ...COMMON.dateBefore,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.date && fieldPath
        ? `dateTime(${fieldPath}) < dateTime(${toJSON(value.date)})`
        : null
    },
    inputComponent:
      SearchFilterDateTimeBeforeInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateTimeBefore',
  }),
  dateTimeEqual: defineSearchOperator({
    ...COMMON.dateEqual,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateEqualValue>) => {
      const date = value?.date && new Date(value.date)
      if (!date || !isValid(date) || !fieldPath) {
        return null
      }
      const dateStart = (value?.includeTime ? startOfMinute(date) : startOfDay(date)).toISOString()
      const dateEnd = (value?.includeTime ? endOfMinute(date) : endOfDay(date)).toISOString()
      return `dateTime(${fieldPath}) > dateTime(${toJSON(
        dateStart,
      )}) && dateTime(${fieldPath}) < dateTime(${toJSON(dateEnd)})`
    },
    inputComponent: SearchFilterDateTimeEqualInput as SearchOperatorInput<OperatorDateEqualValue>,
    type: 'dateTimeEqual',
  }),
  dateTimeLast: defineSearchOperator({
    ...COMMON.dateLast,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue =
        typeof value?.unitValue === 'number' ? Math.floor(value.unitValue) : undefined
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
      unitValue: 7,
    },
    inputComponent: SearchFilterDateLastInput as SearchOperatorInput<OperatorDateLastValue>,
    type: 'dateTimeLast',
  }),
  dateTimeNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateEqualValue>) => {
      const date = value?.date && new Date(value.date)
      if (!date || !isValid(date) || !fieldPath) {
        return null
      }
      const dateStart = (value?.includeTime ? startOfMinute(date) : startOfDay(date)).toISOString()
      const dateEnd = (value?.includeTime ? endOfMinute(date) : endOfDay(date)).toISOString()
      return `dateTime(${fieldPath}) < dateTime(${toJSON(
        dateStart,
      )}) || dateTime(${fieldPath}) > dateTime(${toJSON(dateEnd)})`
    },
    inputComponent: SearchFilterDateTimeEqualInput as SearchOperatorInput<OperatorDateEqualValue>,
    type: 'dateTimeNotEqual',
  }),

  dateTimeRange: defineSearchOperator({
    ...COMMON.dateRange,
    buttonValueComponent:
      SearchButtonValueDateRange as SearchOperatorButtonValue<OperatorDateRangeValue>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateRangeValue>) => {
      return value?.dateMax && value?.dateMin && fieldPath
        ? `dateTime(${fieldPath}) >= dateTime(${toJSON(
            value.dateMin,
          )}) && dateTime(${fieldPath}) <= dateTime(${toJSON(value.dateMax)})`
        : null
    },
    initialValue: {
      includeTime: false,
      dateMax: startOfToday().toISOString(),
      dateMin: null,
    },
    inputComponent: SearchFilterDateTimeRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateTimeRange',
  }),
}
