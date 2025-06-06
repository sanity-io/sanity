import {type ConditionalProperty, type SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import {Fragment} from 'react'

import {unstable_useConditionalProperty as useConditionalProperty} from '../../conditional-property'
import {type ChangeNode} from '../../types'
import {useDocumentChange} from '../hooks'
import {FieldChange} from './FieldChange'
import {GroupChange} from './GroupChange'

/** @internal */
export interface ChangeResolverProps {
  change: ChangeNode
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty
  addParentWrapper?: boolean
}

/** @internal */
export function ChangeResolver(props: ChangeResolverProps) {
  const {change, hidden, readOnly} = props
  const {value = Fragment} = useDocumentChange()

  const isHidden = useConditionalProperty({
    // @todo: is parent missing here?
    document: value as SanityDocument,
    checkProperty: hidden || change.schemaType?.hidden,
    checkPropertyKey: 'hidden',
    value: change.type === 'field' ? change.diff.toValue : undefined,
  })

  const isReadOnly = useConditionalProperty({
    // @todo: is parent missing here?
    document: value as SanityDocument,
    checkProperty: readOnly || change.schemaType?.readOnly,
    checkPropertyKey: 'readOnly',
    value: change.type === 'field' ? change.diff.toValue : undefined,
  })

  if (isHidden) return null

  if (change.type === 'field') {
    return (
      <FieldChange
        change={change}
        readOnly={isReadOnly}
        addParentWrapper={props.addParentWrapper}
      />
    )
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
    // eslint-disable-next-line i18next/no-literal-string
    <Text>
      Unknown change type: <code>{(change as any).type || 'undefined'}</code>
    </Text>
  )
}
