import React, {forwardRef} from 'react'
import {ConditionalProperty} from '@sanity/types'
import {SanityDocument} from '@sanity/client'
import {unstable_useConditionalProperty as useConditionalProperty} from '@sanity/base/hooks'
import {ConditionalReadOnlyContextProvider} from '@sanity/base/_internal'
import {withDocument} from '../../../utils/withDocument'

export interface ConditionalReadOnlyFieldProps {
  parent?: unknown
  value: unknown
  children?: React.ReactNode
  readOnly?: ConditionalProperty
}

export const ConditionalReadOnlyField = ({readOnly, ...rest}: ConditionalReadOnlyFieldProps) => {
  return typeof readOnly === 'function' ? (
    <ConditionalReadOnlyWithDocument {...rest} readOnly={readOnly} />
  ) : (
    <ConditionalReadOnlyContextProvider readOnly={readOnly}>
      {rest.children}
    </ConditionalReadOnlyContextProvider>
  )
}

const ConditionalReadOnlyWithDocument = withDocument(
  forwardRef(function ConditionalReadOnlyWithDocument(
    props: ConditionalReadOnlyFieldProps & {document: SanityDocument},
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
    return (
      <ConditionalReadOnlyContextProvider readOnly={isReadOnly}>
        {children}
      </ConditionalReadOnlyContextProvider>
    )
  })
)
