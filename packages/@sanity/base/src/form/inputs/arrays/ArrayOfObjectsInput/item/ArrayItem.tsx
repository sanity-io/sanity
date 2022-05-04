import {isReferenceSchemaType, SchemaType, ValidationMarker} from '@sanity/types'
import {pathFor, startsWith} from '@sanity/util/paths'
import {Box} from '@sanity/ui'
import React, {memo, useCallback, useMemo, useRef} from 'react'
import {
  ChangeIndicatorScope,
  ContextProvidedChangeIndicator,
} from '../../../../../components/changeIndicators'
import {ArrayMember} from '../types'
import {EMPTY_ARRAY} from '../../../../utils/empty'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {FIXME} from '../../../../types'
import {RowItem} from './RowItem'
import {CellItem} from './CellItem'

export interface ArrayItemProps {
  index: number
  itemKey: string | undefined
  layout?: 'media' | 'default'
  onInsert: (event: {items: unknown[]; position: 'before' | 'after'}) => void
  onRemove: (value: ArrayMember) => void
  onFocus: (event: React.FocusEvent) => void
  onClick: () => void
  value: ArrayMember
  schemaType: SchemaType
  focused?: boolean
  expanded: boolean
  insertableTypes: SchemaType[]
  readOnly: boolean
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
    itemKey,
    expanded,
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
  useScrollIntoViewOnFocusWithin(innerElementRef, expanded)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && innerElementRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      innerElementRef.current?.focus()
    }
  })

  const itemPath = useMemo(() => pathFor([itemKey ? {_key: itemKey} : index]), [index, itemKey])

  const handleRemove = useCallback(() => onRemove(value!), [onRemove, value])

  const options = schemaType.options || {}
  const isSortable = !readOnly && options.sortable !== false

  const isGrid = schemaType.options?.layout === 'grid'
  const ItemComponent = isGrid ? CellItem : RowItem

  const itemValidation = React.useMemo(
    () => validation.filter((marker: ValidationMarker) => startsWith(itemPath, marker.path)),
    [itemPath, validation]
  )

  const scopedValidation: ValidationMarker[] = useMemo(
    () =>
      itemValidation.length === 0
        ? EMPTY_ARRAY
        : itemValidation.map((marker) => {
            if (marker.path.length <= 1) {
              return marker
            }
            const level = marker.level === 'error' ? 'errors' : 'warnings'
            return {
              ...marker,
              item: marker.item.cloneWithMessage?.(`Contains ${level}`),
            } as ValidationMarker
          }),
    [itemValidation]
  )

  const isReference = schemaType && isReferenceSchemaType(schemaType)

  const item = (
    <ItemComponent
      aria-selected={expanded}
      index={index}
      onFocus={onFocus}
      value={value}
      readOnly={readOnly}
      type={schemaType}
      insertableTypes={insertableTypes}
      presence={presence}
      validation={scopedValidation}
      isSortable={isSortable}
      onInsert={onInsert}
      onClick={onClick}
      onRemove={handleRemove}
      ref={innerElementRef}
    />
  )

  return (
    <>
      <ChangeIndicatorScope path={itemPath}>
        <ContextProvidedChangeIndicator compareDeep disabled={expanded && !isReference}>
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
