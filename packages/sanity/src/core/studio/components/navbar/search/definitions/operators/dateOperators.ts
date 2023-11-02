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
  to: string | null
  from: string | null
  includeTime?: boolean
}

export interface OperatorDateLastValue {
  unit: 'day' | 'month' | 'year'
  unitValue: number | null
}

// @todo: don't manually cast `buttonValueComponent` and `inputComponent` once
// we understand why `yarn etl` fails with 'Unable to follow symbol' errors

// Common values shared between date & datetime defs
const COMMON = {
  dateAfter: {
    buttonValueComponent:
      SearchButtonValueDate as SearchOperatorButtonValue<OperatorDateDirectionValue>,
    initialValue: null,
  },
  dateBefore: {
    buttonValueComponent:
      SearchButtonValueDate as SearchOperatorButtonValue<OperatorDateDirectionValue>,
    initialValue: null,
  },
  dateEqual: {
    buttonValueComponent:
      SearchButtonValueDate as SearchOperatorButtonValue<OperatorDateEqualValue>,
    initialValue: {
      date: null,
      includeTime: false,
    },
  },
  dateLast: {
    buttonValueComponent:
      SearchButtonValueDateLast as SearchOperatorButtonValue<OperatorDateLastValue>,
  },
  dateNotEqual: {
    buttonValueComponent:
      SearchButtonValueDate as SearchOperatorButtonValue<OperatorDateEqualValue>,
    initialValue: {
      date: null,
      includeTime: false,
    },
  },
  dateRange: {
    initialValue: null,
  },
}

export const dateOperators = {
  dateAfter: defineSearchOperator({
    ...COMMON.dateAfter,

    nameKey: 'search.operator.date-after.name',
    descriptionKey: 'search.operator.date-after.description',

    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.date && fieldPath ? `${fieldPath} > ${toJSON(value?.date)}` : null
    },
    inputComponent: SearchFilterDateAfterInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    ...COMMON.dateBefore,

    nameKey: 'search.operator.date-before.name',
    descriptionKey: 'search.operator.date-before.description',

    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateDirectionValue>) => {
      return value?.date && fieldPath ? `${fieldPath} < ${toJSON(value?.date)}` : null
    },
    inputComponent: SearchFilterDateBeforeInput as SearchOperatorInput<OperatorDateDirectionValue>,
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    ...COMMON.dateEqual,

    nameKey: 'search.operator.date-equal.name',
    descriptionKey: 'search.operator.date-equal.description',

    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateEqualValue>) => {
      return value?.date && fieldPath ? `${fieldPath} == ${toJSON(value.date)}` : null
    },
    inputComponent: SearchFilterDateEqualInput as SearchOperatorInput<OperatorDateEqualValue>,
    type: 'dateEqual',
  }),
  dateLast: defineSearchOperator({
    ...COMMON.dateLast,

    nameKey: 'search.operator.date-last.name',
    descriptionKey: 'search.operator.date-last.description',

    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue =
        typeof value?.unitValue === 'number' ? Math.floor(value.unitValue) : undefined
      const timestampAgo = Number.isFinite(flooredValue)
        ? sub(new Date(), {
            days: value?.unit === 'day' ? flooredValue : 0,
            months: value?.unit === 'month' ? flooredValue : 0,
            years: value?.unit === 'year' ? flooredValue : 0,
          })
            .toISOString()
            .split('T')[0] // only include date
        : null
      return timestampAgo && fieldPath ? `${fieldPath} > ${toJSON(timestampAgo)}` : null
    },
    inputComponent: SearchFilterDateLastInput as SearchOperatorInput<OperatorDateLastValue>,
    initialValue: {
      unit: 'day',
      unitValue: 7,
    },
    type: 'dateLast',
  }),
  dateNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,

    nameKey: 'search.operator.date-not-equal.name',
    descriptionKey: 'search.operator.date-not-equal.description',

    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateEqualValue>) => {
      return value?.date && fieldPath ? `${fieldPath} != ${toJSON(value.date)}` : null
    },
    inputComponent: SearchFilterDateEqualInput as SearchOperatorInput<OperatorDateEqualValue>,
    type: 'dateNotEqual',
  }),
  dateRange: defineSearchOperator({
    ...COMMON.dateRange,

    nameKey: 'search.operator.date-range.name',
    descriptionKey: 'search.operator.date-range.description',

    buttonValueComponent:
      SearchButtonValueDateRange as SearchOperatorButtonValue<OperatorDateRangeValue>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateRangeValue>) => {
      return value?.to && value?.from && fieldPath
        ? `${fieldPath} >= ${toJSON(value.from)} && ${fieldPath} <= ${toJSON(value.to)}`
        : null
    },
    initialValue: {
      includeTime: false,
      to: startOfToday().toISOString(),
      from: null,
    },
    inputComponent: SearchFilterDateRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateRange',
  }),
  dateTimeAfter: defineSearchOperator({
    ...COMMON.dateAfter,

    nameKey: 'search.operator.date-time-after.name',
    descriptionKey: 'search.operator.date-time-after.description',

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

    nameKey: 'search.operator.date-time-before.name',
    descriptionKey: 'search.operator.date-time-before.description',

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

    nameKey: 'search.operator.date-time-equal.name',
    descriptionKey: 'search.operator.date-time-equal.description',

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

    nameKey: 'search.operator.date-time-last.name',
    descriptionKey: 'search.operator.date-time-last.description',

    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateLastValue>) => {
      const flooredValue =
        typeof value?.unitValue === 'number' ? Math.floor(value.unitValue) : undefined
      const timestampAgo = Number.isFinite(flooredValue)
        ? sub(new Date(), {
            days: value?.unit === 'day' ? flooredValue : 0,
            months: value?.unit === 'month' ? flooredValue : 0,
            years: value?.unit === 'year' ? flooredValue : 0,
          }).toISOString()
        : null
      return timestampAgo && fieldPath
        ? `dateTime(${fieldPath}) > dateTime(${toJSON(timestampAgo)})`
        : null
    },
    initialValue: {
      unit: 'day',
      unitValue: 7,
    },
    inputComponent: SearchFilterDateLastInput as SearchOperatorInput<OperatorDateLastValue>,
    type: 'dateTimeLast',
  }),
  dateTimeNotEqual: defineSearchOperator({
    ...COMMON.dateNotEqual,

    nameKey: 'search.operator.date-time-not-equal.name',
    descriptionKey: 'search.operator.date-time-not-equal.description',

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

    nameKey: 'search.operator.date-time-range.name',
    descriptionKey: 'search.operator.date-time-range.description',

    buttonValueComponent:
      SearchButtonValueDateRange as SearchOperatorButtonValue<OperatorDateRangeValue>,
    groqFilter: ({fieldPath, value}: SearchOperatorParams<OperatorDateRangeValue>) => {
      return value?.to && value?.from && fieldPath
        ? `dateTime(${fieldPath}) >= dateTime(${toJSON(
            value.from,
          )}) && dateTime(${fieldPath}) <= dateTime(${toJSON(value.to)})`
        : null
    },
    initialValue: {
      includeTime: false,
      to: startOfToday().toISOString(),
      from: null,
    },
    inputComponent: SearchFilterDateTimeRangeInput as SearchOperatorInput<OperatorDateRangeValue>,
    type: 'dateTimeRange',
  }),
}
