import type {SanityAsset} from '@sanity/asset-utils'
import type {Reference} from '@sanity/types'
import {format, isValid} from 'date-fns'
import pluralize from 'pluralize-esm'
import React from 'react'
import {useSchema} from '../../../../../../../hooks'
import type {OperatorNumberRangeValue} from '../../../definitions/operators/common'
import type {OperatorDateLastValue} from '../../../definitions/operators/dateOperators'
import {ReferencePreviewTitle} from '../../common/ReferencePreviewTitle'

const DEFAULT_DATE_FORMAT = 'yyyy-MM-dd'

export function SearchButtonValueAsset({value}: {value: SanityAsset}) {
  return <>{value.originalFilename}</>
}

export function SearchButtonValueBoolean({value}: {value: boolean}) {
  return <>{value ? 'True' : 'False'}</>
}

export function SearchButtonValueDate({value}: {value: string}) {
  const date = value ? new Date(value) : null
  if (!date || !isValid(date)) {
    return null
  }
  return <>{format(date, DEFAULT_DATE_FORMAT)}</>
}

export function SearchButtonValueLast({value}: {value: OperatorDateLastValue}) {
  return (
    <>
      {Math.floor(value?.value ?? 0)} {value.unit}
    </>
  )
}

export function SearchButtonValueNumber({value}: {value: number}) {
  return <>{value}</>
}

export function SearchButtonValueNumberCount({value}: {value: number}) {
  return (
    <>
      {value} {pluralize('item', value)}
    </>
  )
}

export function SearchButtonValueNumberRange({value}: {value: OperatorNumberRangeValue}) {
  return (
    <>
      {value.min} → {value.max}
    </>
  )
}

export function SearchButtonValueNumberCountRange({value}: {value: OperatorNumberRangeValue}) {
  return (
    <>
      {value.min} → {value.max} items
    </>
  )
}

export function SearchButtonValueReference({value}: {value: Reference}) {
  const schema = useSchema()
  const documentId = value._ref
  const schemaType = schema.get(value._type)
  if (!schemaType) {
    return null
  }
  return <ReferencePreviewTitle documentId={documentId} schemaType={schemaType} />
}

export function SearchButtonValueString({value}: {value: string | number}) {
  return <>{value}</>
}
