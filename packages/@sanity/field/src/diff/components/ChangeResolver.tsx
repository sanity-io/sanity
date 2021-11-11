import {unstable_useConditionalProperty as useConditionalProperty} from '@sanity/base/hooks'
import {ConditionalProperty, SanityDocument} from '@sanity/types/src'
import * as React from 'react'
import {ChangeNode} from '../../types'
import {DocumentChangeContext} from './DocumentChangeContext'
import {FieldChange} from './FieldChange'
import {GroupChange} from './GroupChange'

export function ChangeResolver({
  change,
  hidden,
  readOnly,
  ...restProps
}: {
  change: ChangeNode
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty | boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  const {value} = React.useContext(DocumentChangeContext)

  if (change.type === 'field') {
    // Resolve the readOnly property if it's a function
    const resolvedReadOnlyField =
      typeof readOnly === 'function' || typeof change.schemaType.readOnly === 'function' ? (
        <ConditionalReadOnlyChange
          readOnly={readOnly || change.schemaType.readOnly}
          document={value}
          value={change.diff.toValue}
          {...restProps}
        >
          <FieldChange change={change} {...restProps} hidden={hidden} />
        </ConditionalReadOnlyChange>
      ) : (
        <FieldChange change={change} {...restProps} hidden={hidden} readOnly={readOnly} />
      )

    // Resolve the hidden property if it's a function
    if (typeof hidden === 'function' || typeof change.schemaType.hidden === 'function') {
      return (
        <ConditionalHiddenChange
          hidden={hidden || change.schemaType.hidden}
          document={value}
          value={change.diff.toValue}
          {...restProps}
        >
          {resolvedReadOnlyField}
        </ConditionalHiddenChange>
      )
    }
    return resolvedReadOnlyField
  }

  if (change.type === 'group') {
    // Resolve the group's readOnly property if it's a function
    const resolvedReadOnlyGroup =
      typeof readOnly === 'function' || typeof change?.schemaType?.readOnly === 'function' ? (
        <ConditionalReadOnlyChange
          readOnly={readOnly || change.schemaType?.readOnly}
          document={value}
          value={undefined}
          {...restProps}
        >
          <GroupChange change={change} {...restProps} />
        </ConditionalReadOnlyChange>
      ) : (
        <GroupChange change={change} {...restProps} hidden={hidden} readOnly={readOnly} />
      )

    if (typeof hidden === 'function' || typeof change?.schemaType?.hidden === 'function') {
      return (
        <ConditionalHiddenChange
          hidden={hidden || change?.schemaType?.hidden}
          document={value}
          value={undefined}
          {...restProps}
        >
          {resolvedReadOnlyGroup}
        </ConditionalHiddenChange>
      )
    }
    return resolvedReadOnlyGroup
  }

  return <div>Unknown change type: {(change as any).type}</div>
}

type Props = {
  parent?: Record<string, unknown> | undefined
  value: unknown
  document: Partial<SanityDocument>
}

const ConditionalHiddenChange = ({
  hidden,
  document,
  ...props
}: Props & {hidden?: ConditionalProperty; children: React.ReactElement}) => {
  const isHidden = useConditionalProperty({
    ...props,
    document: document as SanityDocument,
    checkProperty: hidden,
    checkPropertyKey: 'hidden',
  })
  return isHidden ? null : <>{props.children}</>
}

const ConditionalReadOnlyChange = ({
  readOnly,
  document,
  ...props
}: Props & {readOnly?: ConditionalProperty; children: React.ReactElement}) => {
  const isReadOnly = useConditionalProperty({
    ...props,
    document: document as SanityDocument,
    checkProperty: readOnly,
    checkPropertyKey: 'readOnly',
  })

  return React.cloneElement(props.children, {readOnly: isReadOnly})
}
