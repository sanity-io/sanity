import type {Reference} from '@sanity/types'
import {isValid} from 'date-fns'
import React from 'react'
import {useSchema} from '../../../../../../../hooks'
import {useUnitFormatter} from '../../../../../../../hooks/useUnitFormatter'
import {useDateTimeFormat} from '../../../../../../../hooks/useDateTimeFormat'
import type {
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
  const dateFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: value.includeTime ? 'short' : undefined,
  })
  const date = value?.date ? new Date(value.date) : null
  if (!date || !isValid(date)) {
    return null
  }
  return <>{dateFormat.format(date)}</>
}

export function SearchButtonValueDateLast({
  value,
}: OperatorButtonValueComponentProps<OperatorDateLastValue>) {
  const formatUnit = useUnitFormatter()
  return <>{formatUnit(Math.floor(value?.unitValue ?? 0), value.unit)}</>
}

export function SearchButtonValueDateRange({
  value,
}: OperatorButtonValueComponentProps<OperatorDateRangeValue>) {
  const dateFormat = useDateTimeFormat({
    dateStyle: 'medium',
    timeStyle: value.includeTime ? 'short' : undefined,
  })
  const startDate = value?.from ? new Date(value.from) : null
  const endDate = value?.to ? new Date(value.to) : null
  if (!endDate || !startDate || !isValid(endDate) || !isValid(startDate)) {
    return null
  }

  const from = dateFormat.format(startDate)
  const to = dateFormat.format(endDate)
  return <>{`${from} → ${to}`}</>
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
