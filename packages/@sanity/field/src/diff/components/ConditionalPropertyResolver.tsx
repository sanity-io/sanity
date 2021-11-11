import {unstable_useConditionalProperty as useConditionalProperty} from '@sanity/base/hooks'
import {ConditionalProperty, SanityDocument} from '@sanity/types'
import React from 'react'

type Props = {
  parent?: Record<string, unknown> | undefined
  value: unknown
  document: SanityDocument
  checkProperty: ConditionalProperty
  checkPropertyKey: string
  callback: (isTruthy: boolean) => void
}

export function ConditionalPropertyResolver({callback, ...props}: Props) {
  const isTruthy = useConditionalProperty({
    ...props,
  })
  return <>{callback(isTruthy)}</>
}
