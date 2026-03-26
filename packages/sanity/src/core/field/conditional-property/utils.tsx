import {
  type AsyncConditionalProperty,
  type ConditionalProperty,
  type ConditionalPropertyCallbackContext,
} from '@sanity/types'
import {useEffect, useMemo, useState} from 'react'

import {resolveConditionalPropertyState} from '../../form/store/conditional-property/resolveConditionalProperty'

export function useCheckCondition(
  checkProperty: AsyncConditionalProperty | ConditionalProperty,
  checkPropertyName: string,
  context: ConditionalPropertyCallbackContext,
): boolean {
  const {currentUser, document, getClient, parent, value, path} = context
  const [resolvedAsyncValue, setResolvedAsyncValue] = useState<boolean | undefined>(undefined)

  const result = useMemo(() => {
    return resolveConditionalPropertyState(
      checkProperty,
      {
        currentUser,
        document,
        getClient,
        parent,
        value,
        path,
      },
      {
        checkPropertyName,
        pendingValue: checkPropertyName === 'hidden',
      },
    )
  }, [checkProperty, document, getClient, parent, value, currentUser, checkPropertyName, path])

  useEffect(() => {
    setResolvedAsyncValue(undefined)

    if (!result.isPending || !result.promise) {
      return
    }

    let cancelled = false

    void result.promise.then((nextValue) => {
      if (!cancelled) {
        setResolvedAsyncValue(nextValue)
      }
    })

    return () => {
      cancelled = true
    }
  }, [result.isPending, result.promise])

  return resolvedAsyncValue ?? result.value
}
