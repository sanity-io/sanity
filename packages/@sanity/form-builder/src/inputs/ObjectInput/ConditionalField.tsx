import React, {useMemo} from 'react'
import {
  BaseSchemaType,
  HiddenPredicateContext,
  HiddenOptionPredicate,
  SanityDocument,
} from '@sanity/types'

import withDocument from '../../utils/withDocument'

type HiddenOption = BaseSchemaType['hidden']

function isThenable(value: any) {
  return typeof value?.then === 'function'
}

function checkCondition(
  schemaHiddenOption: HiddenOptionPredicate | undefined | boolean,
  context: HiddenPredicateContext
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

export const ConditionalField = (props: Props) => {
  if (!props.hidden || props.hidden === true) {
    return <>{props.hidden === true ? null : props.children}</>
  }
  return <ConditionalFieldWithDocument {...props} />
}

const ConditionalFieldWithDocument = withDocument(function ConditionalFieldWithDocument(
  props: Props & {document: SanityDocument}
) {
  const {document, parent, value, hidden, children} = props

  const contextArg = useMemo(() => ({document, parent, value}), [document, parent, value])

  const isHidden = useMemo(
    () => (!hidden || typeof hidden === 'boolean' ? hidden : checkCondition(hidden, contextArg)),
    [hidden, contextArg]
  )

  return <>{isHidden ? null : children}</>
})
