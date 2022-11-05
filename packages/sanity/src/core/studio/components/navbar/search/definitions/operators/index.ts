import sub from 'date-fns/sub'
import {ComponentType} from 'react'
import {FieldInputAsset} from '../../components/filters/filter/inputTypes/Asset'
import {FieldInputBoolean} from '../../components/filters/filter/inputTypes/Boolean'
import {FieldInputDate} from '../../components/filters/filter/inputTypes/Date'
import {FieldInputDateLast} from '../../components/filters/filter/inputTypes/DateLast'
import {FieldInputDateRange} from '../../components/filters/filter/inputTypes/DateRange'
import {FieldInputNumber} from '../../components/filters/filter/inputTypes/Number'
import {FieldInputNumberRange} from '../../components/filters/filter/inputTypes/NumberRange'
import {FieldInputReference} from '../../components/filters/filter/inputTypes/Reference'
import {FieldInputString} from '../../components/filters/filter/inputTypes/String'

/**
 * @internal
 */
interface BaseOperator {
  buttonLabel: string
  fn: unknown
  label: string
  type: string
}

type OperatorBuilder<
  TType extends string,
  TValue = unknown,
  TInputComponent = ComponentType<OperatorInputComponentProps<TValue>>
> = BaseOperator & {
  fn: ({fieldPath, value}: {fieldPath?: string; value?: TValue}) => string | null
  initialValue: TValue | null
  inputComponent: TInputComponent
  type: TType
}

type ValuelessOperatorBuilder<
  TType extends string //
> = BaseOperator & {
  fn: ({fieldPath}: {fieldPath?: string}) => string | null
  initialValue?: never
  inputComponent?: never
  type: TType
}

export type Operator =
  | OperatorBuilder<'arrayCountEqual', number>
  | OperatorBuilder<'arrayCountGt', number>
  | OperatorBuilder<'arrayCountGte', number>
  | OperatorBuilder<'arrayCountLt', number>
  | OperatorBuilder<'arrayCountLte', number>
  | OperatorBuilder<'arrayCountNotEqual', number>
  | OperatorBuilder<'assetEqual', string>
  | OperatorBuilder<'booleanEqual', boolean>
  | OperatorBuilder<'dateAfter', Date>
  | OperatorBuilder<'dateBefore', Date>
  | OperatorBuilder<'dateEqual', Date>
  | OperatorBuilder<'dateLast', OperatorDateLastValue>
  | OperatorBuilder<'dateNotEqual', Date>
  | OperatorBuilder<'dateRange', OperatorDateRangeValue>
  | OperatorBuilder<'numberEqual', number>
  | OperatorBuilder<'numberGt', number>
  | OperatorBuilder<'numberGte', number>
  | OperatorBuilder<'numberLt', number>
  | OperatorBuilder<'numberLte', number>
  | OperatorBuilder<'numberNotEqual', number>
  | OperatorBuilder<'numberRange', OperatorNumberRangeValue>
  | OperatorBuilder<'referenceEqual', string>
  | OperatorBuilder<'references', string>
  | OperatorBuilder<'stringEqual', string>
  | OperatorBuilder<'stringMatches', string>
  | OperatorBuilder<'stringNotEqual', string>
  | OperatorBuilder<'stringNotMatches', string>
  | ValuelessOperatorBuilder<'defined'>
  | ValuelessOperatorBuilder<'notDefined'>

export type OperatorType = Operator['type']

export interface OperatorInputComponentProps<T> {
  value: T | null
  onChange: (value: T | null) => void
}
export interface OperatorDateLastValue {
  unit: 'days' | 'months' | 'years'
  value: number | null
}

export interface OperatorDateRangeValue {
  max: Date | null
  min: Date | null
}

export interface OperatorNumberRangeValue {
  max: number | null
  min: number | null
}

function toJSON(val: unknown): string {
  return JSON.stringify(val)
}

export const OPERATORS: Operator[] = [
  {
    buttonLabel: 'has',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is',
    type: 'arrayCountEqual',
  },
  {
    buttonLabel: 'has >',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) > ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity more than (>)',
    type: 'arrayCountGt',
  },
  {
    buttonLabel: 'has ≥',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) >= ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity more than (≥)',
    type: 'arrayCountGte',
  },
  {
    buttonLabel: 'has <',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) < ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than (<)',
    type: 'arrayCountLt',
  },
  {
    buttonLabel: 'has ≤',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) <= ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity less than (≤)',
    type: 'arrayCountLte',
  },
  {
    buttonLabel: 'does not have',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `count(${fieldPath}) != ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputNumber,
    label: 'quantity is not',
    type: 'arrayCountNotEqual',
  },
  {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputAsset,
    label: 'is',
    type: 'assetEqual',
  },
  {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: true,
    inputComponent: FieldInputBoolean,
    label: 'is',
    type: 'booleanEqual',
  },
  {
    buttonLabel: 'after',
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is after',
    type: 'dateAfter',
  },
  {
    buttonLabel: 'before',
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is before',
    type: 'dateBefore',
  },
  {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => {
      const timestamp = value?.toISOString()
      return timestamp && fieldPath ? `${fieldPath} == ${toJSON(timestamp)}` : null
    },
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is',
    type: 'dateEqual',
  },
  {
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
    type: 'dateLast',
  },
  {
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => {
      const timestamp = value?.toISOString()
      return timestamp && fieldPath ? `${fieldPath} != ${toJSON(timestamp)}` : null
    },
    initialValue: null,
    inputComponent: FieldInputDate,
    label: 'is not',
    type: 'dateNotEqual',
  },
  {
    buttonLabel: 'is between',
    fn: ({fieldPath, value}) => `// TODO`,
    initialValue: {
      max: null,
      min: null,
    },
    inputComponent: FieldInputDateRange,
    label: 'is between',
    type: 'dateRange',
  },
  {
    buttonLabel: 'not empty',
    fn: ({fieldPath}) => (fieldPath ? `defined(${fieldPath})` : null),
    label: 'not empty',
    type: 'defined',
  },
  {
    buttonLabel: 'empty',
    fn: ({fieldPath}) => (fieldPath ? `!defined(${fieldPath})` : null),
    label: 'empty',
    type: 'notDefined',
  },
  {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is',
    type: 'numberEqual',
  },
  {
    buttonLabel: '>',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} > ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'greater than (>)',
    type: 'numberGt',
  },
  {
    buttonLabel: '≥',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} >= ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'greater than or equal to (≥)',
    type: 'numberGte',
  },
  {
    buttonLabel: '<',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} < ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than (<)',
    type: 'numberLt',
  },
  {
    buttonLabel: '≤',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} <= ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'less than or equal to (≤)',
    type: 'numberLte',
  },
  {
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    inputComponent: FieldInputNumber,
    initialValue: null,
    label: 'is not',
    type: 'numberNotEqual',
  },
  {
    buttonLabel: 'is between',
    inputComponent: FieldInputNumberRange,
    initialValue: {max: null, min: null},
    fn: ({fieldPath, value}) =>
      value?.max && value?.min && fieldPath
        ? `${fieldPath} > ${toJSON(value.min)} && ${fieldPath} < ${toJSON(value.max)}`
        : '',
    label: 'is between',
    type: 'numberRange',
  },
  {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) =>
      value && fieldPath ? `${fieldPath}._ref == ${toJSON(value)}` : null,
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'is',
    type: 'referenceEqual',
  },
  {
    buttonLabel: 'references document',
    fn: ({value}) => (value ? `references(${toJSON(value)})` : null),
    initialValue: null,
    inputComponent: FieldInputReference,
    label: 'references document',
    type: 'references',
  },
  {
    buttonLabel: 'is',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} == ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is',
    type: 'stringEqual',
  },
  {
    buttonLabel: 'contains',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'contains',
    type: 'stringMatches',
  },
  {
    buttonLabel: 'is not',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} != ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'is not',
    type: 'stringNotEqual',
  },
  {
    buttonLabel: 'does not contain',
    fn: ({fieldPath, value}) => (value && fieldPath ? `${fieldPath} match ${toJSON(value)}` : null),
    initialValue: null,
    inputComponent: FieldInputString,
    label: 'does not contain',
    type: 'stringNotMatches',
  },
]

export function getOperator(operatorType?: OperatorType): Operator | undefined {
  return OPERATORS.find((operator) => operator.type === operatorType)
}

export function getOperatorInitialValue(
  operatorType: OperatorType
): Operator['initialValue'] | undefined {
  return getOperator(operatorType)?.initialValue
}
