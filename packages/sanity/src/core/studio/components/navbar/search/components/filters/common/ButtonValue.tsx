import type {Reference} from '@sanity/types'
import {format, isValid} from 'date-fns'
import pluralize from 'pluralize-esm'
import React from 'react'
import {useSchema} from '../../../../../../../hooks'
import type {OperatorNumberRangeValue} from '../../../definitions/operators/common'
import type {OperatorDateLastValue} from '../../../definitions/operators/dateOperators'
import {OperatorButtonValueComponentProps} from '../../../definitions/operators/operatorTypes'
import {ReferencePreviewTitle} from './ReferencePreviewTitle'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

export function SearchButtonValueBoolean({value}: OperatorButtonValueComponentProps<boolean>) {
  return <>{value ? 'True' : 'False'}</>
}

export function SearchButtonValueDate({value}: OperatorButtonValueComponentProps<string>) {
  const date = value ? new Date(value) : null
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
      {Math.floor(value?.value ?? 0)} {value.unit}
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
  return (
    <>
      {value.min} → {value.max} items
    </>
  )
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
