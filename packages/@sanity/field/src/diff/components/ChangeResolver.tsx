import {unstable_useConditionalProperty as useConditionalProperty} from '@sanity/base/hooks'
import {ConditionalReadOnlyContextProvider} from '@sanity/base/_internal'
import {ConditionalProperty, SanityDocument} from '@sanity/types/src'
import React, {cloneElement, useContext} from 'react'
import {ChangeNode} from '../../types'
import {DocumentChangeContext} from './DocumentChangeContext'
import {FieldChange} from './FieldChange'
import {GroupChange} from './GroupChange'

interface ChangeResolverProps {
  change: ChangeNode
  readOnly?: ConditionalProperty
  hidden?: ConditionalProperty
}

export function ChangeResolver(props: ChangeResolverProps) {
  const {change, hidden, readOnly, ...restProps} = props
  const {value} = useContext(DocumentChangeContext)

  if (change.type === 'field') {
    // Resolve the readOnly property if it's a function
    return (
      <ConditionalHiddenChange
        hidden={hidden || change.schemaType.hidden}
        document={value}
        value={change.diff.toValue}
        {...restProps}
      >
        <ConditionalReadOnlyChange
          readOnly={readOnly || change.schemaType.readOnly}
          document={value}
          value={change.diff.toValue}
          {...restProps}
        >
          <FieldChange change={change} {...restProps} />
        </ConditionalReadOnlyChange>
      </ConditionalHiddenChange>
    )
  }

  if (change.type === 'group') {
    // Resolve the group's readOnly property if it's a function

    return (
      <ConditionalHiddenChange
        hidden={hidden || change?.schemaType?.hidden}
        document={value}
        value={undefined}
        {...restProps}
      >
        <ConditionalReadOnlyChange
          readOnly={readOnly || change.schemaType?.readOnly}
          document={value}
          value={undefined}
          {...restProps}
        >
          <GroupChange
            change={change}
            {...restProps}
            data-testid={`group-change-${change.fieldsetName}`}
          />
        </ConditionalReadOnlyChange>
      </ConditionalHiddenChange>
    )
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
  children,
  ...props
}: Props & {readOnly?: ConditionalProperty; children: React.ReactElement}) => {
  const isReadOnly = useConditionalProperty({
    ...props,
    document: document as SanityDocument,
    checkProperty: readOnly,
    checkPropertyKey: 'readOnly',
  })

  return (
    <ConditionalReadOnlyContextProvider readOnly={isReadOnly}>
      {children}
    </ConditionalReadOnlyContextProvider>
  )
}
