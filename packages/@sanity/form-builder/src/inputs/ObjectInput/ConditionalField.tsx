import React, {useMemo} from 'react'
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

function checkCondition(
  schemaHiddenOption: HiddenOptionCallback | undefined | boolean,
  context: HiddenOptionCallbackContext
): boolean {
  const result =
    typeof schemaHiddenOption === 'function' ? schemaHiddenOption(context) : schemaHiddenOption

  if (isThenable(result)) {
    console.warn(
      '[Warning]: The hidden option is either a promise or a promise returning function. Async callbacks for `hidden` option is not currently supported.'
    )
    return false
  }
  return Boolean(result)
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

  const shouldHide = useMemo(() => checkCondition(hidden, {document, parent, value}), [
    hidden,
    document,
    parent,
    value,
  ])

  return <>{shouldHide ? null : children}</>
})
