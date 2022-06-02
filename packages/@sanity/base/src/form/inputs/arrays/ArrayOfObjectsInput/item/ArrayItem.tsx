import {isReferenceSchemaType, Path, SchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React, {memo, useCallback, useRef} from 'react'
import {
  ChangeIndicatorScope,
  ContextProvidedChangeIndicator,
} from '../../../../../components/changeIndicators'
import {ArrayMember} from '../types'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {FIXME} from '../../../../types'
import {useChildPresence} from '../../../../studio/contexts/Presence'
import {RowItem} from './RowItem'
import {CellItem} from './CellItem'

export interface ArrayItemProps {
  index: number
  onInsert: (event: {items: unknown[]; position: 'before' | 'after'}) => void
  onRemove: (value: ArrayMember) => void
  onFocus: (event: React.FocusEvent) => void
  onClick: () => void
  value: ArrayMember
  schemaType: SchemaType
  focused?: boolean
  open: boolean
  path: Path
  insertableTypes: SchemaType[]
  readOnly?: boolean
  presence: FIXME[]
  validation: FIXME[]
  children: React.ReactNode
}

// This renders the item / preview of unexpanded array items
export const ArrayItem = memo(function ArrayItem(props: ArrayItemProps) {
  const {
    value,
    insertableTypes,
    schemaType,
    index,
    open,
    path,
    onClick,
    readOnly,
    presence = [],
    validation = [],
    focused,
    onRemove,
    onInsert,
    onFocus,
    children,
  } = props

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  // this is here to make sure the item is visible if it's being edited behind a modal
  useScrollIntoViewOnFocusWithin(innerElementRef, open)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && innerElementRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      innerElementRef.current?.focus()
    }
  })

  const childPresence = useChildPresence(path)

  const handleRemove = useCallback(() => onRemove(value!), [onRemove, value])

  const options = schemaType.options || {}
  const isSortable = !readOnly && options.sortable !== false

  const isGrid = schemaType.options?.layout === 'grid'
  const ItemComponent = isGrid ? CellItem : RowItem

  const isReference = schemaType && isReferenceSchemaType(schemaType)

  const item = (
    <ItemComponent
      aria-selected={open}
      index={index}
      onFocus={onFocus}
      value={value}
      readOnly={readOnly}
      type={schemaType}
      insertableTypes={insertableTypes}
      presence={open ? presence : childPresence}
      validation={validation}
      isSortable={isSortable}
      onInsert={onInsert}
      onClick={onClick}
      onRemove={handleRemove}
      ref={innerElementRef}
    />
  )

  return (
    <>
      <ChangeIndicatorScope path={path}>
        <ContextProvidedChangeIndicator compareDeep disabled={open && !isReference}>
          {isGrid ? (
            // grid should be rendered without a margin
            item
          ) : (
            <Box marginX={1}>{item}</Box>
          )}
        </ContextProvidedChangeIndicator>
      </ChangeIndicatorScope>
      {children}
    </>
  )
})
