import {ConditionalProperty, SanityDocument} from '@sanity/types'
import React from 'react'
import {Text} from '@sanity/ui'
import {unstable_useConditionalProperty as useConditionalProperty} from '../../conditional-property'
import {ChangeNode} from '../../types'
import {useDocumentChange} from '../hooks'
import {FieldChange} from './FieldChange'
import {GroupChange} from './GroupChange'

/** @internal */
export interface ChangeResolverProps {
  change: ChangeNode
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty
}

/** @internal */
export function ChangeResolver(props: ChangeResolverProps) {
  const {change, hidden, readOnly} = props
  const {value} = useDocumentChange()

  const isHidden = useConditionalProperty({
    // @todo: is parent missing here?
    document: value as SanityDocument,
    checkProperty: hidden || change.schemaType?.hidden,
    checkPropertyKey: 'hidden',
    value: change.type === 'field' ? change.diff.toValue : undefined,
    path: change.path,
  })

  const isReadOnly = useConditionalProperty({
    // @todo: is parent missing here?
    document: value as SanityDocument,
    checkProperty: readOnly || change.schemaType?.readOnly,
    checkPropertyKey: 'readOnly',
    value: change.type === 'field' ? change.diff.toValue : undefined,
    path: change.path,
  })

  if (isHidden) return null

  if (change.type === 'field') {
    return <FieldChange change={change} readOnly={isReadOnly} />
  }

  if (change.type === 'group') {
    return (
      <GroupChange
        change={change}
        data-testid={`group-change-${change.fieldsetName}`}
        readOnly={isReadOnly}
      />
    )
  }

  return (
    <Text>
      Unknown change type: <code>{(change as any).type || 'undefined'}</code>
    </Text>
  )
}
