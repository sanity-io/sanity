import {useResolveConditionalProperty} from '@sanity/base/hooks'
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
  const isTruthy = useResolveConditionalProperty({
    ...props,
  })
  return <>{callback(isTruthy)}</>
}
