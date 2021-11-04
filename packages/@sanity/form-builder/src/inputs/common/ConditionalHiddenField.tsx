import React, {forwardRef} from 'react'
import {SanityDocument, ConditionalPropertyCallback, ConditionalProperty} from '@sanity/types'
import {useCurrentUser} from '@sanity/base/hooks'
import withDocument from '../../utils/withDocument'
import {omitDeprecatedRole, useCheckCondition} from '../../utils/common'

interface Props {
  hidden: ConditionalProperty
  parent: Record<string, unknown> | undefined
  value: unknown
  children?: React.ReactNode
}

export const ConditionalHiddenField = ({hidden, ...rest}: Props) => {
  return typeof hidden === 'function' ? (
    <ConditionalHiddenFieldWithDocument {...rest} hidden={hidden} />
  ) : (
    <>{hidden === true ? null : rest.children}</>
  )
}

const ConditionalHiddenFieldWithDocument = withDocument(
  forwardRef(function ConditionalHiddenFieldWithDocument(
    props: Omit<Props, 'hidden'> & {document: SanityDocument; hidden: ConditionalPropertyCallback},
    ref /* ignore ref as there's no place to put it */
  ) {
    const {document, parent, value, hidden, children} = props

    const {value: currentUser} = useCurrentUser()
    const shouldHide = useCheckCondition(hidden, 'hidden', {
      currentUser: omitDeprecatedRole(currentUser),
      document,
      parent,
      value,
    })

    return <>{shouldHide ? null : children}</>
  })
)
