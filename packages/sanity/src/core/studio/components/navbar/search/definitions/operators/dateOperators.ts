import sub from 'date-fns/sub'
import {typed} from '@sanity/types'
import {FieldInputDateLast} from '../../components/filters/filter/inputTypes/DateLast'
import {FieldInputDate} from '../../components/filters/filter/inputTypes/Date'
import {FieldInputDateRange} from '../../components/filters/filter/inputTypes/DateRange'
import {toJSON} from './operatorUtils'
import {defineSearchOperator} from './operatorTypes'

export interface OperatorDateRangeValue {
  max: Date | null
  min: Date | null
}

export interface OperatorDateLastValue {
  unit: 'days' | 'months' | 'years'
  value: number | null
}

export const dateOperators = {
  dateAfter: defineSearchOperator({
    buttonLabel: 'after',
    buttonValue: (value) => (value ? value.toISOString() : null),
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is after',
    type: 'dateAfter',
  }),
  dateBefore: defineSearchOperator({
    buttonLabel: 'before',
    buttonValue: (value) => (value ? value.toISOString() : null),
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is before',
    type: 'dateBefore',
  }),
  dateEqual: defineSearchOperator({
    buttonLabel: 'is',
    buttonValue: (value) => (value ? value.toISOString() : null),
    fn: ({fieldPath, value}: {fieldPath?: string; value?: Date}) => {
      const timestamp = value?.toISOString()
      return timestamp && fieldPath ? `${fieldPath} == ${toJSON(timestamp)}` : null
    },
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is',
    type: 'dateEqual',
  }),
  dateLast: defineSearchOperator({
    buttonLabel: 'last',
    buttonValue: (value) => (value.value && value.unit ? `${value.value} ${value.unit}` : null),
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
    type: 'dateLast',
  }),
  dateNotEqual: defineSearchOperator({
    buttonLabel: 'is not',
    buttonValue: (value) => (value ? value.toISOString() : null),
    fn: ({fieldPath, value}: {fieldPath?: string; value?: Date}) => {
      const timestamp = value?.toISOString()
      return timestamp && fieldPath ? `${fieldPath} != ${toJSON(timestamp)}` : null
    },
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is not',
    type: 'dateNotEqual',
  }),
  dateRange: defineSearchOperator({
    buttonLabel: 'is between',
    buttonValue: (value) => (value?.max && value?.min ? `${value.min} → ${value.max}` : null),
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: typed<OperatorDateRangeValue>({
      max: null,
      min: null,
    }),
    inputComponent: FieldInputDateRange,
    label: 'is between',
    type: 'dateRange',
  }),
}
