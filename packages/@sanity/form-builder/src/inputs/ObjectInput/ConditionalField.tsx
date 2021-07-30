import React, {useMemo, useRef} from 'react'
import {
  BaseSchemaType,
  HiddenOptionCallbackContext,
  HiddenOptionCallback,
  SanityDocument,
} from '@sanity/types'

import withDocument from '../../utils/withDocument'

type HiddenOption = BaseSchemaType['hidden']

function isThenable(value: any) {
  return typeof value?.then === 'function'
}

function useCheckCondition(
  hidden: HiddenOptionCallback,
  {document, parent, value}: HiddenOptionCallbackContext
) {
  const didWarn = useRef(false)
  return useMemo(() => {
    let result = false
    try {
      result = hidden({document, parent, value})
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
  }, [hidden, document, parent, value])
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

const ConditionalFieldWithDocument = withDocument(function ConditionalFieldWithDocument(
  props: Omit<Props, 'hidden'> & {document: SanityDocument; hidden: HiddenOptionCallback}
) {
  const {document, parent, value, hidden, children} = props

  const shouldHide = useCheckCondition(hidden, {document, parent, value})

  return <>{shouldHide ? null : children}</>
})
