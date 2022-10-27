import {ComponentType} from 'react'
import {FieldInputAsset} from '../components/filters/inputTypes/Asset'
import {FieldInputBoolean} from '../components/filters/inputTypes/Boolean'
import {FieldInputDate} from '../components/filters/inputTypes/Date'
import {FieldInputDateLast} from '../components/filters/inputTypes/DateLast'
import {FieldInputDateRange} from '../components/filters/inputTypes/DateRange'
import {FieldInputNumber} from '../components/filters/inputTypes/Number'
import {FieldInputNumberRange} from '../components/filters/inputTypes/NumberRange'
import {FieldInputReference} from '../components/filters/inputTypes/Reference'
import {FieldInputString} from '../components/filters/inputTypes/String'
import {FieldSearchFilter} from '../types'

export type FilterInputType =
  | 'boolean'
  | 'date'
  | 'dateLast'
  | 'dateRange'
  | 'file'
  | 'image'
  | 'number'
  | 'numberRange'
  | 'reference'
  | 'string'

// TODO: clean up

interface BaseFilterInputTypeComponentProps {
  filter: FieldSearchFilter
  inputType: FilterInputType
  // onChange: (value: any) => void
}

export interface FilterInputTypeAssetComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: 'file' | 'image'
  onChange: (value: string) => void
}

export interface FilterInputTypeBooleanComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: Extract<FilterInputType, 'boolean'>
  onChange: (value: boolean) => void
}

export interface FilterInputTypeDateComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: 'date'
  onChange: (value: Date) => void
}

export interface FilterInputTypeDateLastComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: 'dateLast'
  onChange: (value: {unit: string | null; value: string | null}) => void
}

export interface FilterInputTypeDateRangeComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: 'dateRange'
  onChange: (value: {max: Date | null; min: Date | null}) => void
}

export interface FilterInputTypeNumberComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: 'string'
  onChange: (value: number) => void
}

export interface FilterInputTypeNumberRangeComponentProps
  extends BaseFilterInputTypeComponentProps {
  inputType: 'numberRange'
  onChange: (value: {max: number | null; min: number | null}) => void
}

export interface FilterInputTypeReferenceComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: 'reference'
  onChange: (value: string | null) => void
}

export interface FilterInputTypeStringComponentProps extends BaseFilterInputTypeComponentProps {
  inputType: 'string'
  onChange: (value: string | null) => void
}

export type FilterInputTypeComponentProps =
  | FilterInputTypeAssetComponentProps
  | FilterInputTypeBooleanComponentProps
  | FilterInputTypeDateComponentProps
  | FilterInputTypeDateLastComponentProps
  | FilterInputTypeDateRangeComponentProps
  | FilterInputTypeNumberComponentProps
  | FilterInputTypeNumberRangeComponentProps
  | FilterInputTypeReferenceComponentProps
  | FilterInputTypeStringComponentProps

// TODO: fix types
export const FILTER_INPUT_TYPE_COMPONENTS: Record<
  FilterInputType,
  ComponentType<any>
  // ComponentType
> = {
  boolean: FieldInputBoolean,
  date: FieldInputDate,
  dateLast: FieldInputDateLast,
  dateRange: FieldInputDateRange,
  file: FieldInputAsset,
  image: FieldInputAsset,
  reference: FieldInputReference,
  number: FieldInputNumber,
  numberRange: FieldInputNumberRange,
  string: FieldInputString,
}
