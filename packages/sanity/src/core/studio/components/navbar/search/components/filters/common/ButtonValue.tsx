import type {Reference} from '@sanity/types'
import {format, isValid} from 'date-fns'
import pluralize from 'pluralize-esm'
import React from 'react'
import {useSchema} from '../../../../../../../hooks'
import type {OperatorNumberRangeValue} from '../../../definitions/operators/common'
import type {
  OperatorDateDirectionValue,
  OperatorDateEqualValue,
  OperatorDateLastValue,
  OperatorDateRangeValue,
} from '../../../definitions/operators/dateOperators'
import {OperatorButtonValueComponentProps} from '../../../definitions/operators/operatorTypes'
import {useTranslation} from '../../../../../../../i18n'
import {ReferencePreviewTitle} from './ReferencePreviewTitle'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

export function SearchButtonValueBoolean({value}: OperatorButtonValueComponentProps<boolean>) {
  const {t} = useTranslation()
  return <>{value ? t('search.filter-boolean-true') : t('search.filter-boolean-false')}</>
}

export function SearchButtonValueDate({
  value,
}: OperatorButtonValueComponentProps<OperatorDateEqualValue>) {
  const date = value?.date ? new Date(value.date) : null
  if (!date || !isValid(date)) {
    return null
  }
  return <>{format(date, DEFAULT_DATE_FORMAT)}</>
}

export function SearchButtonValueDateDirection({
  value,
}: OperatorButtonValueComponentProps<OperatorDateDirectionValue>) {
  const date = value?.date ? new Date(value.date) : null
  if (!date || !isValid(date)) {
    return null
  }
  return <>{format(date, DEFAULT_DATE_FORMAT)}</>
}

export function SearchButtonValueDateLast({
  value,
}: OperatorButtonValueComponentProps<OperatorDateLastValue>) {
  return (
    <>
      {Math.floor(value?.unitValue ?? 0)} {value.unit}
    </>
  )
}

export function SearchButtonValueDateRange({
  value,
}: OperatorButtonValueComponentProps<OperatorDateRangeValue>) {
  const startDate = value?.dateMin ? new Date(value.dateMin) : null
  const endDate = value?.dateMax ? new Date(value.dateMax) : null
  if (!endDate || !startDate || !isValid(endDate) || !isValid(startDate)) {
    return null
  }
  return (
    <>
      {format(startDate, DEFAULT_DATE_FORMAT)} → {format(endDate, DEFAULT_DATE_FORMAT)}
    </>
  )
}

export function SearchButtonValueNumber({value}: OperatorButtonValueComponentProps<number>) {
  return <>{value}</>
}

export function SearchButtonValueNumberCount({value}: OperatorButtonValueComponentProps<number>) {
  return (
    <>
      {value} {pluralize('item', value)}
    </>
  )
}

export function SearchButtonValueNumberRange({
  value,
}: OperatorButtonValueComponentProps<OperatorNumberRangeValue>) {
  return (
    <>
      {value.min} → {value.max}
    </>
  )
}

export function SearchButtonValueNumberCountRange({
  value,
}: OperatorButtonValueComponentProps<OperatorNumberRangeValue>) {
  const {t} = useTranslation()
  return <>{t('search.number-items-range', {min: value.min, max: value.max})}</>
}

export function SearchButtonValueReference({value}: OperatorButtonValueComponentProps<Reference>) {
  const schema = useSchema()
  const documentId = value._ref
  const schemaType = schema.get(value._type)
  if (!schemaType) {
    return null
  }
  return <ReferencePreviewTitle documentId={documentId} schemaType={schemaType} />
}

export function SearchButtonValueString({
  value,
}: OperatorButtonValueComponentProps<string | number>) {
  return <>{value}</>
}
