import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {tap} from 'rxjs/operators'
import {useToast} from '@sanity/ui'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {
  ArrayInputInsertEvent,
  ObjectInputProps,
  ObjectItem,
  ObjectItemProps,
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../../types'
import {insert, PatchArg, PatchEvent, setIfMissing, unset} from '../../../patch'
import {ensureKey} from '../../../utils/ensureKey'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {ArrayOfObjectsItemMember} from '../../../store'
import {createProtoValue} from '../../../utils/createProtoValue'
import {isEmptyItem} from '../../../store/utils/isEmptyItem'
import {useResolveInitialValueForType} from '../../../../store'
import {resolveInitialArrayValues} from '../../common/resolveInitialArrayValues'
import {constructDescriptionId} from '../../common/constructDescriptionId'

/**
 *
 * @hidden
 * @beta
 */
export interface MemberItemProps {
  member: ArrayOfObjectsItemMember
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderInlineBlock?: RenderBlockCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderPreview: RenderPreviewCallback
}

/**
 *
 * @hidden
 * @beta
 */
export function ArrayOfObjectsItem(props: MemberItemProps) {
  const focusRef = useRef<{focus: () => void}>()
  const {
    member,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
  } = props

  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onPathOpen,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    onFieldGroupSelect,
  } = useFormCallbacks()
  const resolveInitialValue = useResolveInitialValueForType()

  useDidUpdate(member.item.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const onRemove = useCallback(() => {
    onChange(PatchEvent.from([unset([{_key: member.key}])]))
  }, [member.key, onChange])

  const handleOpenItem = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onSetPathCollapsed(path, false)
    },
    [onPathOpen, onSetPathCollapsed],
  )
  const toast = useToast()

  // Note: this handles inserting *siblings*
  const handleInsert = useCallback(
    (event: Omit<ArrayInputInsertEvent<ObjectItem>, 'referenceItem'>) => {
      if (event.items.length === 0) {
        throw new Error('Insert event should include at least one item')
      }
      const itemsWithKeys = event.items.map((item) => ensureKey(item))

      onChange(PatchEvent.from([insert(itemsWithKeys, event.position, [{_key: member.key}])]))

      const focusItemKey = itemsWithKeys[0]._key
      const parentPath = member.item.path.slice(0, -1)
      const itemPath = [...parentPath, {_key: focusItemKey}]

      // Set focus at the first item (todo: verify that this is the expected/better behavior when adding multiple items)
      onPathFocus(itemPath)

      const shouldOpen = event.open !== false
      if (event.skipInitialValue) {
        if (shouldOpen) {
          handleOpenItem(itemPath)
        }
      } else {
        resolveInitialArrayValues(itemsWithKeys, member.parentSchemaType, resolveInitialValue)
          .pipe(
            tap((result) => {
              if (result.type === 'patch') {
                onChange(PatchEvent.from(result.patches))
              } else {
                toast.push({
                  title: `Could not resolve initial value`,
                  description: `Unable to resolve initial value for type: ${result.schemaType.title}: ${result.error.message}.`,
                  status: 'error',
                })
              }
            }),
          )
          .subscribe({
            complete: () => {
              if (shouldOpen) {
                handleOpenItem(itemPath)
              }
            },
          })
      }
    },
    [
      handleOpenItem,
      member.item.path,
      member.key,
      member.parentSchemaType,
      onChange,
      onPathFocus,
      resolveInitialValue,
      toast,
    ],
  )

  const handleBlur = useCallback(() => {
    onPathBlur(member.item.path)
  }, [member.item.path, onPathBlur])

  const handleFocus = useCallback(() => {
    onPathFocus(member.item.path)
  }, [member.item.path, onPathFocus])

  const handleFocusChildPath = useCallback(
    (path: Path) => {
      onPathFocus(member.item.path.concat(path))
    },
    [member.item.path, onPathFocus],
  )

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      onChange(
        PatchEvent.from(event)
          .prepend(setIfMissing(createProtoValue(member.item.schemaType)))
          .prefixAll({_key: member.key}),
      )
    },
    [onChange, member.item.schemaType, member.key],
  )
  const handleCollapse = useCallback(() => {
    onSetPathCollapsed(member.item.path, true)
  }, [onSetPathCollapsed, member.item.path])

  const handleExpand = useCallback(() => {
    onSetPathCollapsed(member.item.path, false)
  }, [onSetPathCollapsed, member.item.path])

  const handleCollapseField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.item.path.concat(fieldName), true)
    },
    [onSetPathCollapsed, member.item.path],
  )
  const handleExpandField = useCallback(
    (fieldName: string) => {
      onSetPathCollapsed(member.item.path.concat(fieldName), false)
    },
    [onSetPathCollapsed, member.item.path],
  )
  const handleCloseField = useCallback(() => {
    onPathOpen(member.item.path)
  }, [onPathOpen, member.item.path])
  const handleOpenField = useCallback(
    (fieldName: string) => {
      onPathOpen(member.item.path.concat(fieldName))
    },
    [onPathOpen, member.item.path],
  )
  const handleExpandFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.item.path.concat(fieldsetName), false)
    },
    [onSetFieldSetCollapsed, member.item.path],
  )
  const handleCollapseFieldSet = useCallback(
    (fieldsetName: string) => {
      onSetFieldSetCollapsed(member.item.path.concat(fieldsetName), true)
    },
    [onSetFieldSetCollapsed, member.item.path],
  )

  const handleOpen = useCallback(() => {
    onPathOpen(member.item.path)
  }, [onPathOpen, member.item.path])

  const isEmptyValue = !member.item.value || isEmptyItem(member.item.value)
  const handleClose = useCallback(() => {
    if (isEmptyValue) {
      onRemove()
    }

    const parentPath = member.item.path.slice(0, -1)
    onPathOpen(parentPath)
    // @todo fix issue where the focus is on the item and not the parent
    onPathFocus(parentPath)
  }, [isEmptyValue, onPathOpen, member.item.path, onPathFocus, onRemove])

  const handleSelectFieldGroup = useCallback(
    (groupName: string) => {
      onFieldGroupSelect(member.item.path, groupName)
    },
    [onFieldGroupSelect, member.item.path],
  )

  const elementProps = useMemo(
    (): ObjectInputProps['elementProps'] => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      id: member.item.id,
      ref: focusRef,
      'aria-describedby': constructDescriptionId(
        member.item.id,
        member.item.schemaType.description,
      ),
    }),
    [handleBlur, handleFocus, member.item.id, member.item.schemaType.description],
  )

  const inputProps = useMemo((): Omit<ObjectInputProps, 'renderDefault'> => {
    return {
      changed: member.item.changed,
      focusPath: member.item.focusPath,
      focused: member.item.focused,
      groups: member.item.groups,
      id: member.item.id,
      level: member.item.level,
      members: member.item.members,
      onChange: handleChange,
      onFieldClose: handleCloseField,
      onFieldCollapse: handleCollapseField,
      onFieldSetCollapse: handleCollapseFieldSet,
      onFieldExpand: handleExpandField,
      onFieldSetExpand: handleExpandFieldSet,
      onFieldGroupSelect: handleSelectFieldGroup,
      onPathFocus: handleFocusChildPath,
      onFieldOpen: handleOpenField,
      path: member.item.path,
      presence: member.item.presence,
      readOnly: member.item.readOnly,
      renderAnnotation,
      renderBlock,
      renderField,
      renderInlineBlock,
      renderInput,
      renderItem,
      renderPreview,
      schemaType: member.item.schemaType,
      validation: member.item.validation,
      value: member.item.value,
      elementProps: elementProps,
    }
  }, [
    elementProps,
    handleChange,
    handleCloseField,
    handleCollapseField,
    handleCollapseFieldSet,
    handleExpandField,
    handleExpandFieldSet,
    handleFocusChildPath,
    handleOpenField,
    handleSelectFieldGroup,
    member.item.changed,
    member.item.focusPath,
    member.item.focused,
    member.item.groups,
    member.item.id,
    member.item.level,
    member.item.members,
    member.item.path,
    member.item.presence,
    member.item.readOnly,
    member.item.schemaType,
    member.item.validation,
    member.item.value,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const itemProps = useMemo((): Omit<ObjectItemProps, 'renderDefault'> => {
    return {
      key: member.key,
      index: member.index,
      level: member.item.level,
      value: member.item.value,
      title: member.item.schemaType.title,
      description: member.item.schemaType.description,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
      schemaType: member.item.schemaType,
      parentSchemaType: member.parentSchemaType,
      onInsert: handleInsert,
      onRemove,
      presence: member.item.presence,
      validation: member.item.validation,
      open: member.open,
      onOpen: handleOpen,
      onClose: handleClose,
      onExpand: handleExpand,
      onCollapse: handleCollapse,
      readOnly: member.item.readOnly,
      focused: member.item.focused,
      onFocus: handleFocus,
      onBlur: handleBlur,
      inputId: member.item.id,
      path: member.item.path,
      children: renderedInput,
      changed: member.item.changed,
      inputProps,
    }
  }, [
    member.key,
    member.index,
    member.item.level,
    member.item.value,
    member.item.schemaType,
    member.parentSchemaType,
    member.item.presence,
    member.item.validation,
    member.item.readOnly,
    member.item.focused,
    member.item.id,
    member.item.path,
    member.item.changed,
    member.collapsible,
    member.collapsed,
    member.open,
    handleInsert,
    onRemove,
    handleOpen,
    handleClose,
    handleExpand,
    handleCollapse,
    handleFocus,
    handleBlur,
    renderedInput,
    inputProps,
  ])

  return (
    <FormCallbacksProvider
      onFieldGroupSelect={onFieldGroupSelect}
      onChange={handleChange}
      onPathOpen={onPathOpen}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      onSetPathCollapsed={onSetPathCollapsed}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderItem(itemProps), [itemProps, renderItem])}
    </FormCallbacksProvider>
  )
}
