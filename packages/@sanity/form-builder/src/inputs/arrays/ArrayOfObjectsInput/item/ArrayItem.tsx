/* eslint-disable import/no-unresolved */

import {ChangeIndicatorScope} from '@sanity/base/lib/change-indicators'
import {ContextProvidedChangeIndicator} from '@sanity/base/lib/change-indicators/ChangeIndicator'
import {ArraySchemaType, isValidationMarker, Marker, Path} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import React, {useCallback, useRef} from 'react'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import PatchEvent from '../../../../PatchEvent'
import {ArrayMember} from '../types'
import {EMPTY_ARRAY} from '../../../../utils/empty'
import {hasFocusWithinPath} from '../../../../utils/focusUtils'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {getItemType} from './helpers'
import {EditDialog} from './EditDialog'
import {ItemRow} from './ItemRow'
import {ItemCell} from './ItemCell'

interface ArrayInputListItemProps {
  type: ArraySchemaType
  value: ArrayMember
  index: number
  compareValue?: any[]
  markers: Marker[]
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

export function ArrayItem(props: ArrayInputListItemProps) {
  const {
    value,
    markers,
    type,
    index,
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

  const emitFocus = useCallback(
    (path: Path = EMPTY_ARRAY) => {
      if (value._key) {
        onFocus([{_key: value._key}, ...path])
      }
    },
    [onFocus, value._key]
  )

  const handleFocus = useCallback(() => emitFocus(), [emitFocus])
  const handleEditOpen = useCallback(() => emitFocus([FOCUS_TERMINATOR]), [emitFocus])
  const handleEditClose = useCallback(() => emitFocus(), [emitFocus])

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
  const isSortable = !readOnly && !type.readOnly && options.sortable !== false
  const validation = markers.filter(isValidationMarker)
  const scopedValidation =
    validation.length === 0
      ? EMPTY_ARRAY
      : validation.map((marker) => {
          if (marker.path.length <= 1) {
            return marker
          }
          const level = marker.level === 'error' ? 'errors' : 'warnings'
          return {...marker, item: marker.item.cloneWithMessage(`Contains ${level}`)}
        })

  const isEditing = hasFocusWithinPath(focusPath, value)

  const itemType = getItemType(type, value)
  const LayoutComponent = type.options?.layout === 'grid' ? ItemCell : ItemRow

  return (
    <>
      <ChangeIndicatorScope path={[value._key ? {_key: value._key} : index]}>
        <ContextProvidedChangeIndicator compareDeep disabled={isEditing}>
          <LayoutComponent
            aria-selected={isEditing}
            value={value}
            readOnly={readOnly}
            type={itemType}
            presence={isEditing ? EMPTY_ARRAY : presence}
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
          markers={markers}
          referenceElement={innerElementRef.current}
          filterField={filterField}
          focusPath={focusPath}
          onFocus={onFocus}
          onBlur={onBlur}
          type={itemType}
          dialogType={type?.options?.editModal || 'dialog'}
          value={value}
          readOnly={readOnly || itemType.readOnly || false}
          presence={presence}
          compareValue={compareValue}
        />
      )}
    </>
  )
}
