/* eslint-disable import/no-unresolved */

import {ChangeIndicatorScope, ContextProvidedChangeIndicator} from '@sanity/base/change-indicators'
import {ArraySchemaType, isValidationMarker, Marker, Path} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import React, {memo, useCallback, useMemo, useRef} from 'react'
import {FOCUS_TERMINATOR, pathFor, startsWith} from '@sanity/util/paths'
import PatchEvent from '../../../../PatchEvent'
import {ArrayMember} from '../types'
import {EMPTY_ARRAY} from '../../../../utils/empty'
import {hasFocusWithinPath} from '../../../../utils/focusUtils'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {getItemType, isEmpty} from './helpers'
import {EditDialog} from './EditDialog'
import {ItemRow} from './ItemRow'
import {ItemCell} from './ItemCell'

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
  } = props

  const innerElementRef = useRef(null)

  const hasFocusWithin = hasFocusWithinPath(props.focusPath, props.value)
  useScrollIntoViewOnFocusWithin(innerElementRef, hasFocusWithin)

  const itemPath = useMemo(() => pathFor([itemKey ? {_key: itemKey} : index]), [index, itemKey])

  const emitFocus = useCallback(
    (path: Path = EMPTY_ARRAY) => {
      if (itemKey) {
        onFocus([{_key: itemKey}, ...path])
      }
    },
    [onFocus, itemKey]
  )

  const handleFocus = useCallback(() => emitFocus(), [emitFocus])
  const handleEditOpen = useCallback(() => emitFocus([FOCUS_TERMINATOR]), [emitFocus])
  const handleEditClose = useCallback(() => {
    if (isEmpty(value)) {
      onRemove(value)
    }
    emitFocus()
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
  const isSortable = !readOnly && options.sortable !== false

  const isEditing = hasFocusWithinPath(focusPath, value)

  const itemType = getItemType(type, value)
  const LayoutComponent = type.options?.layout === 'grid' ? ItemCell : ItemRow

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

  return (
    <>
      <ChangeIndicatorScope path={itemPath}>
        <ContextProvidedChangeIndicator compareDeep disabled={isEditing}>
          <LayoutComponent
            aria-selected={isEditing}
            value={value}
            readOnly={readOnly}
            type={itemType}
            presence={isEditing ? EMPTY_ARRAY : itemPresence}
            validation={scopedValidation}
            isSortable={isSortable}
            onFocus={handleFocus}
            onClick={itemType ? handleEditOpen : undefined}
            onRemove={handleRemove}
            onKeyPress={handleKeyPress}
            ref={innerElementRef}
          />
        </ContextProvidedChangeIndicator>
      </ChangeIndicatorScope>

      {isEditing && itemType && (
        <EditDialog
          onChange={handleChange}
          onClose={handleEditClose}
          markers={itemMarkers}
          referenceElement={innerElementRef.current}
          filterField={filterField}
          focusPath={focusPath}
          onFocus={onFocus}
          onBlur={onBlur}
          type={itemType}
          dialogType={type?.options?.editModal || 'dialog'}
          value={value}
          readOnly={readOnly}
          presence={itemPresence}
          compareValue={compareValue}
        />
      )}
    </>
  )
})
