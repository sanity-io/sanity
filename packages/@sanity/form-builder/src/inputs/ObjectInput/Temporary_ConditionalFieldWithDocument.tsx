import React, {forwardRef, useMemo, useRef} from 'react'

import {
  ConditionalPropertyCallbackContext,
  ConditionalPropertyCallback,
  SanityDocument,
  CurrentUser,
} from '@sanity/types'
import {useCurrentUser} from '@sanity/base/hooks'
import withDocument from '../../utils/withDocument'

function isThenable(value: any) {
  return typeof value?.then === 'function'
}

function omitDeprecatedRole(user: CurrentUser): Omit<CurrentUser, 'role'> {
  const {role, ...propsA} = user
  return propsA
}

function useCheckCondition(
  hidden: ConditionalPropertyCallback,
  {document, currentUser, value}: ConditionalPropertyCallbackContext
) {
  const didWarn = useRef(false)
  return useMemo(() => {
    let result = false
    try {
      result = hidden({
        document,
        currentUser,
        value,
      })
    } catch (err) {
      console.error(`An error occurred while checking if field should be hidden: ${err.message}`)
      return false
    }
    if (isThenable(result) && !didWarn.current) {
      console.warn(
        'The hidden option is either a promise or a promise returning function. Async callbacks for `hidden` option is not currently supported.'
      )
      return false
    }
    return result
  }, [hidden, document, value, currentUser])
}

export const ConditionalFieldWithDocument = withDocument(
  forwardRef(function ConditionalFieldWithDocument(
    props: {
      document: SanityDocument
      value: unknown
      children: React.ReactNode
      hidden: ConditionalPropertyCallback
    },
    ref /* ignore ref as there's no place to put it */
  ) {
    const {document, value, hidden, children} = props

    const {value: currentUser} = useCurrentUser()
    const shouldHide = useCheckCondition(hidden, {
      currentUser: omitDeprecatedRole(currentUser),
      document,
      value,
    })

    return <>{shouldHide ? null : children}</>
  })
)
