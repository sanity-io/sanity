import {ArraySchemaType, isReferenceSchemaType, ValidationMarker} from '@sanity/types'
import {FOCUS_TERMINATOR, pathFor, startsWith} from '@sanity/util/paths'
import {Box} from '@sanity/ui'
import React, {memo, useCallback, useMemo, useRef} from 'react'
import {FormFieldPresence} from '../../../../../presence'
import {
  ChangeIndicatorScope,
  ContextProvidedChangeIndicator,
} from '../../../../../components/changeIndicators'
import {FieldProps, FIXME, FormBuilderFilterFieldFn, InputComponentProps} from '../../../../types'
import {PatchEvent} from '../../../../patch'
import {ArrayMember, InsertEvent, ReferenceItemComponentType} from '../types'
import {EMPTY_ARRAY} from '../../../../utils/empty'
import {hasFocusAtPath, hasFocusWithinPath} from '../../../../utils/focusUtils'
import {useScrollIntoViewOnFocusWithin} from '../../../../hooks/useScrollIntoViewOnFocusWithin'
import {EditPortal} from '../../../../components/EditPortal'
import {useDidUpdate} from '../../../../hooks/useDidUpdate'
import {useConditionalReadOnly} from '../../../../../conditional-property/conditionalReadOnly'
import {getItemType, isEmpty} from './helpers'
import {ItemForm} from './ItemForm'
import {RowItem} from './RowItem'
import {CellItem} from './CellItem'

export interface ArrayItemProps extends Omit<InputComponentProps, 'level' | 'onChange' | 'value'> {
  ReferenceItemComponent: ReferenceItemComponentType
  filterField: FormBuilderFilterFieldFn
  index: number
  itemKey: string | undefined
  layout?: 'media' | 'default'
  onChange: (event: PatchEvent, value: ArrayMember) => void
  onInsert: (event: InsertEvent) => void
  onRemove: (value: ArrayMember) => void
  value: ArrayMember
}

export const ArrayItem = memo(function ArrayItem(props: ArrayItemProps) {
  const {
    value,
    validation,
    type,
    index,
    itemKey,
    readOnly,
    presence,
    focusPath = EMPTY_ARRAY,
    onFocus,
    onChange,
    onRemove,
    onInsert,
    onBlur,
    filterField,
    compareValue,
    ReferenceItemComponent,
  } = props

  const innerElementRef = useRef<HTMLDivElement | null>(null)
  const conditionalReadOnly = useConditionalReadOnly() ?? readOnly
  const hasFocusWithin = hasFocusWithinPath(focusPath, props.value)
  useScrollIntoViewOnFocusWithin(innerElementRef, hasFocusWithin)

  useDidUpdate(hasFocusAtPath(focusPath, props.value), (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus && innerElementRef.current) {
      // Note: if editing an inline item, focus is handled by the item input itself and no ref is being set
      innerElementRef.current?.focus()
    }
  })

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
    if (isEmpty(value!)) {
      onRemove(value)
    } else {
      emitFocus([])
    }
  }, [value, onRemove, emitFocus])

  const handleChange = useCallback(
    (event: PatchEvent, valueOverride?: ArrayMember) =>
      onChange(event, typeof valueOverride === 'undefined' ? value! : valueOverride),
    [onChange, value]
  )

  const handleRemove = useCallback(() => onRemove(value!), [onRemove, value])

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
  const isSortable = !conditionalReadOnly && options.sortable !== false

  const isEditing = hasFocusWithinPath(focusPath, value)

  const itemType = getItemType(type as FIXME, value)

  const isGrid = type.options?.layout === 'grid'
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
      <>TODO</>
      // <ItemForm
      //   onChange={handleChange}
      //   validation={itemValidation}
      //   filterField={filterField}
      //   focusPath={focusPath}
      //   onFocus={onFocus}
      //   onBlur={onBlur}
      //   onInsert={onInsert}
      //   insertableTypes={type.of}
      //   type={itemType as ArraySchemaType<ArrayMember>}
      //   value={value}
      //   isSortable={isSortable}
      //   ReferenceItemComponent={ReferenceItemComponent}
      //   readOnly={conditionalReadOnly}
      //   presence={itemPresence}
      //   compareValue={compareValue}
      // />
    )

    return isReference && !isGrid ? (
      form
    ) : (
      <EditPortal
        header={
          conditionalReadOnly ? `View ${itemType?.title || ''}` : `Edit ${itemType?.title || ''}`
        }
        type={type?.options?.editModal === 'fold' ? 'dialog' : type?.options?.editModal || 'dialog'}
        id={value?._key}
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
    isGrid,
    isReference,
    isSortable,
    itemValidation,
    itemPresence,
    itemType,
    onBlur,
    onFocus,
    onInsert,
    conditionalReadOnly,
    type,
    value,
  ])

  const item = (
    <ItemComponent
      aria-selected={isEditing}
      index={index}
      value={value}
      readOnly={readOnly}
      type={itemType}
      insertableTypes={(type as FIXME).of}
      presence={isEditing ? EMPTY_ARRAY : itemPresence}
      validation={scopedValidation}
      isSortable={isSortable}
      onInsert={onInsert}
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
      {isEditing && (!isReference || isGrid) ? editForm : null}
    </>
  )
})
