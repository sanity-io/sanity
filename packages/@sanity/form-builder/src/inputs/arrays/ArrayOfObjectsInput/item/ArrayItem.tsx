/* eslint-disable import/no-unresolved,no-nested-ternary */

import {ChangeIndicatorScope, ContextProvidedChangeIndicator} from '@sanity/base/change-indicators'
import {
  ArraySchemaType,
  isReferenceSchemaType,
  isValidationMarker,
  Marker,
  Path,
} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import React, {memo, useCallback, useMemo, useRef} from 'react'
import {FOCUS_TERMINATOR, pathFor, startsWith} from '@sanity/util/paths'
import {Box} from '@sanity/ui'
import PatchEvent from '../../../../PatchEvent'
import {ArrayMember, ReferenceItemComponentType} from '../types'
import {EMPTY_ARRAY} from '../../../../utils/empty'
import {hasFocusWithinPath} from '../../../../utils/focusUtils'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {EditPortal} from '../../../../EditPortal'
import {getItemType, isEmpty} from './helpers'
import {ItemForm} from './ItemForm'
import {RowItem} from './RowItem'
import {CellItem} from './CellItem'

interface ArrayInputListItemProps {
  type: ArraySchemaType
  value: ArrayMember
  index: number
  compareValue?: any[]
  markers: Marker[]
  itemKey: string | undefined
  layout?: 'media' | 'default'
  onRemove: (value: ArrayMember) => void
  onChange: (event: PatchEvent, value: ArrayMember) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  ReferenceItemComponent: ReferenceItemComponentType
  filterField: () => any
  readOnly: boolean
  focusPath: Path
  presence: FormFieldPresence[]
}

export const ArrayItem = memo(function ArrayItem(props: ArrayInputListItemProps) {
  const {
    value,
    markers,
    type,
    index,
    itemKey,
    readOnly,
    presence,
    focusPath,
    onFocus,
    onChange,
    onRemove,
    onBlur,
    filterField,
    compareValue,
    ReferenceItemComponent,
  } = props

  const innerElementRef = useRef(null)

  const hasFocusWithin = hasFocusWithinPath(props.focusPath, props.value)
  useScrollIntoViewOnFocusWithin(innerElementRef, hasFocusWithin)

  const itemPath = useMemo(() => pathFor([itemKey ? {_key: itemKey} : index]), [index, itemKey])

  const emitFocus = useCallback(
    (path) => {
      if (itemKey) {
        onFocus([{_key: itemKey}, ...path])
      }
    },
    [onFocus, itemKey]
  )
  const handleItemElementFocus = useCallback(
    (event: React.FocusEvent) => {
      if (event.target === event.currentTarget) {
        emitFocus([])
      }
    },
    [emitFocus]
  )
  const handleEditOpen = useCallback(() => emitFocus([FOCUS_TERMINATOR]), [emitFocus])
  const handleEditClose = useCallback(() => {
    if (isEmpty(value)) {
      onRemove(value)
    }
    emitFocus([])
  }, [value, onRemove, emitFocus])

  const handleChange = useCallback(
    (event: PatchEvent, valueOverride?: ArrayMember) =>
      onChange(event, typeof valueOverride === 'undefined' ? value : valueOverride),
    [onChange, value]
  )

  const handleRemove = useCallback(() => onRemove(value), [onRemove, value])

  const handleKeyPress = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        handleEditOpen()
      }
    },
    [handleEditOpen]
  )

  const options = type.options || {}
  const isSortable = !readOnly && !type?.readOnly && options.sortable !== false

  const isEditing = hasFocusWithinPath(focusPath, value)

  const itemType = getItemType(type, value)

  const isGrid = type.options?.layout === 'grid'
  const ItemComponent = isGrid ? CellItem : RowItem

  const itemMarkers = React.useMemo(
    () => markers.filter((marker: Marker) => startsWith(itemPath, marker.path)),
    [itemPath, markers]
  )

  const scopedValidation = useMemo(
    () =>
      itemMarkers.length === 0
        ? EMPTY_ARRAY
        : itemMarkers.filter(isValidationMarker).map((marker) => {
            if (marker.path.length <= 1) {
              return marker
            }
            const level = marker.level === 'error' ? 'errors' : 'warnings'
            return {...marker, item: marker.item.cloneWithMessage(`Contains ${level}`)}
          }),
    [itemMarkers]
  )

  const itemPresence = useMemo(
    () =>
      presence.filter((presenceItem: FormFieldPresence) => startsWith(itemPath, presenceItem.path)),
    [itemPath, presence]
  )

  const isReference = itemType && isReferenceSchemaType(itemType)
  const editForm = useMemo(() => {
    if (!isEditing && !isReference) {
      return null
    }

    const form = (
      <ItemForm
        onChange={handleChange}
        markers={itemMarkers}
        filterField={filterField}
        focusPath={focusPath}
        onFocus={onFocus}
        onBlur={onBlur}
        type={itemType}
        value={value}
        isSortable={isSortable}
        ReferenceItemComponent={ReferenceItemComponent}
        readOnly={readOnly || itemType?.readOnly || false}
        presence={itemPresence}
        compareValue={compareValue}
      />
    )

    return isReference ? (
      form
    ) : (
      <EditPortal
        header={readOnly ? `View ${itemType?.title || ''}` : `Edit ${itemType?.title || ''}`}
        type={type?.options?.editModal === 'fold' ? 'dialog' : type?.options?.editModal || 'dialog'}
        id={value._key}
        onClose={handleEditClose}
        legacy_referenceElement={innerElementRef.current}
      >
        {form}
      </EditPortal>
    )
  }, [
    ReferenceItemComponent,
    compareValue,
    filterField,
    focusPath,
    handleChange,
    handleEditClose,
    isEditing,
    isReference,
    isSortable,
    itemMarkers,
    itemPresence,
    itemType,
    onBlur,
    onFocus,
    readOnly,
    type?.options?.editModal,
    value,
  ])

  const item = (
    <ItemComponent
      aria-selected={isEditing}
      index={index}
      value={value}
      readOnly={readOnly}
      type={itemType}
      presence={isEditing ? EMPTY_ARRAY : itemPresence}
      validation={scopedValidation}
      isSortable={isSortable}
      onFocus={handleItemElementFocus}
      onClick={itemType ? handleEditOpen : undefined}
      onRemove={handleRemove}
      onKeyPress={handleKeyPress}
      ref={innerElementRef}
    />
  )

  return (
    <>
      <ChangeIndicatorScope path={itemPath}>
        <ContextProvidedChangeIndicator compareDeep disabled={isEditing && !isReference}>
          {isGrid ? (
            // grid should be rendered without a margin
            item
          ) : (
            <Box marginX={1}>{isReference ? editForm : item}</Box>
          )}
        </ContextProvidedChangeIndicator>
      </ChangeIndicatorScope>
      {isEditing && !isReference && editForm}
    </>
  )
})
