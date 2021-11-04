import {useCurrentUser} from '@sanity/base/hooks'
import {ConditionalProperty, SanityDocument} from '@sanity/types'
import React, {forwardRef} from 'react'
import {mappedChildren, omitDeprecatedRole, useCheckCondition} from '../../utils/common'
import withDocument from '../../utils/withDocument'

interface Props {
  readOnly: ConditionalProperty
  parent: Record<string, unknown> | undefined
  value: unknown
  children?: React.ReactNode | React.ReactNode[]
}

export const ConditionalReadOnlyField = ({readOnly, ...rest}: Props) => {
  return typeof readOnly === 'function' ? (
    <ConditionalReadOnlyFieldWithDocument {...rest} readOnly={readOnly} />
  ) : (
    <>{rest.children}</>
  )
}

export const ConditionalReadOnlyFieldWithDocument = withDocument(
  forwardRef(function PropertyCallbackFieldWithDocument(
    props: Omit<Props, 'readOnly'> & {
      document: SanityDocument
      readOnly?: ConditionalProperty
    },
    ref /* ignore ref as there's no place to put it */
  ) {
    const {document, parent, value, readOnly, children} = props
    const {value: currentUser} = useCurrentUser()
    const isReadOnly = useCheckCondition(readOnly, 'readOnly', {
      currentUser: omitDeprecatedRole(currentUser),
      document,
      parent,
      value,
    })

    return <>{mappedChildren({children, childProps: {readOnly: isReadOnly}})}</>
  })
)
