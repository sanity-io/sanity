import React, {forwardRef} from 'react'
import {ConditionalProperty} from '@sanity/types'
import {SanityDocument} from '@sanity/client'
import {unstable_useConditionalProperty as useConditionalProperty} from '@sanity/base/hooks'
import withDocument from '../../utils/withDocument'

type Props = {
  parent?: unknown
  value: unknown
  children?: React.ReactNode
  readOnly?: ConditionalProperty
}

export const ConditionalReadOnlyField = ({readOnly, ...rest}: Props) => {
  return typeof readOnly === 'function' ? (
    <ConditionalReadOnlyWithDocument {...rest} readOnly={readOnly} />
  ) : (
    <>{mappedChildren({children: rest.children, childProps: {readOnly: readOnly}})}</>
  )
}

const ConditionalReadOnlyWithDocument = withDocument(
  forwardRef(function ConditionalReadOnlyWithDocument(
    props: Props & {document: SanityDocument},
    ref /* ignore ref as there's no place to put it */
  ) {
    const {readOnly, value, parent, document, children} = props
    const isReadOnly = useConditionalProperty({
      checkProperty: readOnly,
      checkPropertyKey: 'readOnly',
      value,
      parent,
      document,
    })
    return <>{mappedChildren({children, childProps: {readOnly: isReadOnly}})}</>
  })
)

type ChildrenWithPropsProps = {
  children: React.ReactNode | React.ReactNode[]
  childProps: Record<string, unknown>
}

function mappedChildren({children, childProps}: ChildrenWithPropsProps) {
  if (!Array.isArray(children)) {
    children = [children]
  }
  return React.Children.map(children, function (child) {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, childProps)
    }
    return child
  })
}
