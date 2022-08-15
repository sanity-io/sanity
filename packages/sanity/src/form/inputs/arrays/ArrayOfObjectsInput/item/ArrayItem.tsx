/* eslint-disable camelcase */

import {isReferenceSchemaType, Path, SchemaType} from '@sanity/types'
import {Box} from '@sanity/ui'
import React, {memo, useCallback, useRef} from 'react'
import {ChangeIndicator} from '../../../../../components/changeIndicators'
import {_ArrayInput_ArrayMember} from '../types'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {FIXME, RenderPreviewCallback} from '../../../../types'
import {useChildPresence} from '../../../../studio/contexts/Presence'
import {RowItem} from './RowItem'
import {CellItem} from './CellItem'

export interface ArrayItemProps {
  children: React.ReactNode
  focused?: boolean
  changed: boolean
  layout?: 'grid'
  index: number
  insertableTypes: SchemaType[]
  onClick: () => void
  onFocus: (event: React.FocusEvent) => void
  onInsert: (event: {items: unknown[]; position: 'before' | 'after'}) => void
  onRemove: (value: _ArrayInput_ArrayMember) => void
  open: boolean
  path: Path
  presence: FIXME[]
  readOnly?: boolean
  renderPreview: RenderPreviewCallback
  schemaType: SchemaType
  validation: FIXME[]
  value: _ArrayInput_ArrayMember
}

// This renders the item / preview of unexpanded array items
export const ArrayItem = memo(function ArrayItem(props: ArrayItemProps) {
  const {
    changed,
    value,
    insertableTypes,
    schemaType,
    index,
    open,
    path,
    onClick,
    layout,
    readOnly,
    presence = [],
    validation = [],
    focused,
    onRemove,
    onInsert,
    onFocus,
    children,
    renderPreview,
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

  const isGrid = layout === 'grid'
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
      renderPreview={renderPreview}
    />
  )

  return (
    <>
      <ChangeIndicator
        path={path}
        disabled={open && !isReference}
        isChanged={changed}
        hasFocus={!!focused}
      >
        {isGrid ? (
          // grid should be rendered without a margin
          item
        ) : (
          <Box marginX={1}>{item}</Box>
        )}
      </ChangeIndicator>
      {children}
    </>
  )
})
