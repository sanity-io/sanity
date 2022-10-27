import type {FilterFormState} from './filters'

export const ARRAY_FORM_STATES: FilterFormState[] = [
  {
    initialValue: null,
    input: 'number',
    operator: 'countEqualTo',
  },
  {
    initialValue: null,
    input: 'number',
    operator: 'countGreaterThan',
  },
  {
    initialValue: null,
    input: 'number',
    operator: 'countLessThan',
  },
  {
    initialValue: null,
    operator: 'notEmpty',
  },
  {
    initialValue: null,
    operator: 'empty',
  },
]

export const ASSET_FORM_STATES: FilterFormState[] = [
  {
    initialValue: null,
    operator: 'equalTo',
  },
  {
    initialValue: null,
    operator: 'notEqualTo',
  },
  {
    initialValue: null,
    operator: 'notEmpty',
  },
  {
    initialValue: null,
    operator: 'empty',
  },
]

export const DATE_FORM_STATES: FilterFormState[] = [
  {
    initialValue: {
      unit: 'days',
      value: 7,
    },
    input: 'dateLast',
    operator: 'dateLast',
  },
  {
    initialValue: new Date().toISOString(),
    input: 'date',
    operator: 'dateAfter',
  },
  {
    initialValue: new Date().toISOString(),
    input: 'date',
    operator: 'dateBefore',
  },
  {
    initialValue: new Date().toISOString(),
    input: 'date',
    operator: 'equalTo',
  },
  {
    initialValue: {
      max: 1,
      min: 1,
    },
    input: 'dateRange',
    operator: 'dateRange',
  },
  {
    initialValue: new Date().toISOString(),
    input: 'date',
    operator: 'notEqualTo',
  },
]

export const GEOPOINT_FORM_STATES: FilterFormState[] = [
  {
    initialValue: null,
    operator: 'notEmpty',
  },
  {
    initialValue: null,
    operator: 'empty',
  },
]

export const NUMBER_FORM_STATES: FilterFormState[] = [
  {
    initialValue: null,
    input: 'number',
    operator: 'equalTo',
  },
  {
    initialValue: null,
    input: 'number',
    operator: 'notEqualTo',
  },
  {
    initialValue: {
      max: null,
      min: null,
    },
    input: 'numberRange',
    operator: 'numberRange',
  },
  {
    initialValue: null,
    input: 'number',
    operator: 'greaterThan',
  },
  {
    initialValue: null,
    input: 'number',
    operator: 'greaterThanOrEqualTo',
  },
  {
    initialValue: null,
    input: 'number',
    operator: 'lessThan',
  },
  {
    initialValue: null,
    input: 'number',
    operator: 'lessThanOrEqualTo',
  },
  {
    initialValue: null,
    operator: 'notEmpty',
  },
  {
    initialValue: null,
    operator: 'empty',
  },
]

export const REFERENCE_FORM_STATES: FilterFormState[] = [
  {
    initialValue: null,
    input: 'reference',
    operator: 'equalTo',
  },
  {
    initialValue: null,
    input: 'reference',
    operator: 'notEqualTo',
  },
]

export const STRING_FORM_STATES: FilterFormState[] = [
  {
    initialValue: null,
    input: 'string',
    operator: 'matches',
  },
  {
    initialValue: null,
    input: 'string',
    operator: 'notMatches',
  },
  {
    initialValue: null,
    input: 'string',
    operator: 'equalTo',
  },
  {
    initialValue: null,
    input: 'string',
    operator: 'notEqualTo',
  },
  {
    initialValue: null,
    operator: 'notEmpty',
  },
  {
    initialValue: null,
    operator: 'empty',
  },
]
