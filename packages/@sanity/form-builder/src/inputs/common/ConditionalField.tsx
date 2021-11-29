import React, {forwardRef, useMemo, useRef} from 'react'
import type {
  HiddenOption,
  HiddenOptionCallbackContext,
  HiddenOptionCallback,
  SanityDocument,
  CurrentUser,
} from '@sanity/types'

import {useCurrentUser} from '@sanity/base/hooks'
import withDocument from '../../utils/withDocument'

function isThenable(value: any) {
  return typeof value?.then === 'function'
}

function omitDeprecatedRole(user: CurrentUser): Omit<CurrentUser, 'role'> {
  const {role, ...rest} = user
  return rest
}

function useCheckCondition(
  hidden: HiddenOptionCallback,
  {document, parent, value, currentUser}: HiddenOptionCallbackContext
) {
  const didWarn = useRef(false)
  return useMemo(() => {
    let result = false
    try {
      result = hidden({
        document,
        parent,
        value,
        currentUser,
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
  }, [hidden, document, parent, value, currentUser])
}

interface Props {
  hidden: HiddenOption
  parent: Record<string, unknown> | undefined
  value: unknown
  children?: React.ReactNode
}

export const ConditionalField = ({hidden, ...rest}: Props) => {
  return typeof hidden === 'function' ? (
    <ConditionalFieldWithDocument {...rest} hidden={hidden} />
  ) : (
    <>{hidden === true ? null : rest.children}</>
  )
}

const ConditionalFieldWithDocument = withDocument(
  forwardRef(function ConditionalFieldWithDocument(
    props: Omit<Props, 'hidden'> & {document: SanityDocument; hidden: HiddenOptionCallback},
    ref /* ignore ref as there's no place to put it */
  ) {
    const {document, parent, value, hidden, children} = props

    const {value: currentUser} = useCurrentUser()
    const shouldHide = useCheckCondition(hidden, {
      currentUser: omitDeprecatedRole(currentUser),
      document,
      parent,
      value,
    })

    return <>{shouldHide ? null : children}</>
  })
)
