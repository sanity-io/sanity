import type {Reference} from '@sanity/types'
import {format, isValid} from 'date-fns'
import pluralize from 'pluralize-esm'
import React from 'react'
import {useSchema} from '../../../../../../../hooks'
import type {OperatorNumberRangeValue} from '../../../definitions/operators/common'
import type {OperatorDateLastValue} from '../../../definitions/operators/dateOperators'
import {ReferencePreviewTitle} from '../../common/ReferencePreviewTitle'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

export function ButtonValueAsset({value}: {value: string}) {
  return <>{value.slice(0, 8)}</>
}

export function ButtonValueBoolean({value}: {value: boolean}) {
  return <>{value ? 'True' : 'False'}</>
}

export function ButtonValueDate({value}: {value: string}) {
  const date = value ? new Date(value) : null
  if (!date || !isValid(date)) {
    return null
  }
  return <>{format(date, DEFAULT_DATE_FORMAT)}</>
}

export function ButtonValueLast({value}: {value: OperatorDateLastValue}) {
  return (
    <>
      {Math.floor(value?.value ?? 0)} {value.unit}
    </>
  )
}

export function ButtonValueNumber({value}: {value: number}) {
  return <>{value}</>
}

export function ButtonValueNumberCount({value}: {value: number}) {
  return (
    <>
      {value} {pluralize('item', value)}
    </>
  )
}

export function ButtonValueNumberRange({value}: {value: OperatorNumberRangeValue}) {
  return (
    <>
      {value.min} → {value.max}
    </>
  )
}

export function ButtonValueNumberCountRange({value}: {value: OperatorNumberRangeValue}) {
  return (
    <>
      {value.min} → {value.max} items
    </>
  )
}

export function ButtonValueReference({value}: {value: Reference}) {
  const schema = useSchema()
  const documentId = value._ref
  const schemaType = schema.get(value._type)
  if (!schemaType) {
    return null
  }
  return <ReferencePreviewTitle documentId={documentId} schemaType={schemaType} />
}

export function ButtonValueString({value}: {value: string | number}) {
  return <>{value}</>
}
