import React, {forwardRef} from 'react'
import {useResolveConditionalProperty} from '@sanity/base/hooks'
import {ConditionalProperty} from '@sanity/types'
import {SanityDocument} from '@sanity/client'
import withDocument from '../../utils/withDocument'

type Props = {
  parent?: Record<string, unknown> | undefined
  value: unknown
  children?: React.ReactNode
  hidden?: ConditionalProperty
}

export const ConditionalHiddenField = ({hidden, ...rest}: Props) => {
  return typeof hidden === 'function' ? (
    <ConditionalHiddenWithDocument {...rest} hidden={hidden} />
  ) : (
    <>{hidden === true ? null : rest.children}</>
  )
}

const ConditionalHiddenWithDocument = withDocument(
  forwardRef(function ConditionalHiddenWithDocument(
    props: Props & {document: SanityDocument; hidden},
    ref /* ignore ref as there's no place to put it */
  ) {
    const {hidden, value, parent, document, children} = props
    const isHidden = useResolveConditionalProperty({
      checkProperty: hidden,
      checkPropertyKey: 'hidden',
      value,
      parent,
      document,
    })
    return <>{isHidden ? null : children}</>
  })
)
