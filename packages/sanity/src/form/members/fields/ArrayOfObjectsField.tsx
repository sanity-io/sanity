import React, {useCallback, useMemo, useRef} from 'react'
import {Path} from '@sanity/types'
import {useResolveInitialValueForType} from '../../../core'
import {ArrayOfObjectsFormNode, FieldMember} from '../../store'
import {
  ArrayFieldProps,
  ArrayOfObjectsInputProps,
  InsertItemEvent,
  MoveItemEvent,
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types'
import {FormCallbacksProvider, useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {insert, PatchArg, PatchEvent, setIfMissing, unset} from '../../patch'
import {ensureKey} from '../../utils/ensureKey'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an array input
 * Note: "ArrayField" in this context means an object field of an array type
 * @param props - Component props
 */
export function ArrayOfObjectsField(props: {
  member: FieldMember<ArrayOfObjectsFormNode>
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}) {
  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
    onPathOpen,
    onFieldGroupSelect,
  } = useFormCallbacks()

  const {member, renderField, renderInput, renderItem, renderPreview} = props
  const focusRef = useRef<Element & {focus: () => void}>()

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleFocus = useCallback(
    (event: React.FocusEvent) => {
      // We want to handle focus when the array input *itself* element receives
      // focus, not when a child element receives focus, but React has decided
      // to let focus bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (event.currentTarget === event.target && event.currentTarget === focusRef.current) {
        onPathFocus(member.field.path)
      }
    },
    [member.field.path, onPathFocus]
  )

  const handleBlur = useCallback(
    (event: React.FocusEvent) => {
      // We want to handle blur when the array input *itself* element receives
      // blur, not when a child element receives blur, but React has decided
      // to let focus events bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (event.currentTarget === event.target && event.currentTarget === focusRef.current) {
        onPathBlur(member.field.path)
      }
    },
    [member.field.path, onPathBlur]
  )

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      onChange(PatchEvent.from(event).prepend(setIfMissing([])).prefixAll(member.name))
    },
    [onChange, member.name]
  )

  const handleInsert = useCallback(
    (event: InsertItemEvent) => {
      onChange(
        PatchEvent.from([
          setIfMissing([]),
          insert(
            event.items.map((item) => ensureKey(item)),
            event.position,
            [event.referenceItem]
          ),
        ]).prefixAll(member.name)
      )
    },
    [member.name, onChange]
  )

  const handleMoveItem = useCallback(
    (event: MoveItemEvent) => {
      const value = member.field.value
      const item = value?.[event.fromIndex] as any
      const refItem = value?.[event.toIndex] as any
      if (event.fromIndex === event.toIndex) {
        return
      }

      if (!(item as any)?._key || !(refItem as any)?._key) {
        // eslint-disable-next-line no-console
        console.error(
          'Neither the item you are moving nor the item you are moving to have a key. Cannot continue.'
        )

        return
      }

      onChange(
        PatchEvent.from([
          unset([{_key: item._key}]),
          insert([item], event.fromIndex > event.toIndex ? 'before' : 'after', [
            {_key: refItem._key},
          ]),
        ]).prefixAll(member.name)
      )
    },
    [member.field.value, member.name, onChange]
  )

  const handlePrependItem = useCallback(
    (item: any) => {
      onChange(
        PatchEvent.from([setIfMissing([]), insert([ensureKey(item)], 'before', [0])]).prefixAll(
          member.name
        )
      )
    },
    [member.name, onChange]
  )
  const handleAppendItem = useCallback(
    (item: any) => {
      onChange(
        PatchEvent.from([setIfMissing([]), insert([ensureKey(item)], 'after', [-1])]).prefixAll(
          member.name
        )
      )
    },
    [member.name, onChange]
  )

  const handleCollapse = useCallback(() => {
    onSetPathCollapsed(member.field.path, true)
  }, [onSetPathCollapsed, member.field.path])

  const handleExpand = useCallback(() => {
    onSetPathCollapsed(member.field.path, false)
  }, [onSetPathCollapsed, member.field.path])

  const handleCollapseItem = useCallback(
    (itemKey: string) => {
      onSetPathCollapsed(member.field.path.concat({_key: itemKey}), true)
    },
    [onSetPathCollapsed, member.field.path]
  )

  const handleExpandItem = useCallback(
    (itemKey: string) => {
      onSetPathCollapsed(member.field.path.concat({_key: itemKey}), false)
    },
    [onSetPathCollapsed, member.field.path]
  )

  const handleOpenItem = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onSetPathCollapsed(path, false)
    },
    [onPathOpen, onSetPathCollapsed]
  )

  const handleCloseItem = useCallback(() => {
    onPathOpen(member.field.path)
    onSetPathCollapsed(member.field.path, true)
  }, [onPathOpen, member.field.path, onSetPathCollapsed])

  const handleRemoveItem = useCallback(
    (itemKey: string) => {
      onChange(PatchEvent.from([unset(member.field.path.concat({_key: itemKey}))]))
    },
    [onChange, member.field.path]
  )

  const handleFocusChildPath = useCallback(
    (path: Path) => {
      onPathFocus(member.field.path.concat(path))
    },
    [member.field.path, onPathFocus]
  )

  const elementProps = useMemo(
    (): ArrayOfObjectsInputProps['elementProps'] => ({
      onBlur: handleBlur,
      onFocus: handleFocus,
      id: member.field.id,
      ref: focusRef,
    }),
    [handleBlur, handleFocus, member.field.id]
  )

  const resolveInitialValue = useResolveInitialValueForType()

  const inputProps = useMemo((): ArrayOfObjectsInputProps => {
    return {
      level: member.field.level,
      members: member.field.members,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType,
      changed: member.field.changed,
      id: member.field.id,
      onExpand: handleExpand,
      onCollapse: handleCollapse,
      onExpandItem: handleExpandItem,
      onCollapseItem: handleCollapseItem,
      onCloseItem: handleCloseItem,
      onOpenItem: handleOpenItem,

      focusPath: member.field.focusPath,
      focused: member.field.focused,

      path: member.field.path,

      onChange: handleChange,
      onInsert: handleInsert,
      onMoveItem: handleMoveItem,
      onRemoveItem: handleRemoveItem,
      onAppendItem: handleAppendItem,
      onPrependItem: handlePrependItem,
      onFocusPath: handleFocusChildPath,
      resolveInitialValue,

      validation: member.field.validation,
      presence: member.field.presence,
      renderInput,
      renderField,
      renderItem,
      renderPreview,
      elementProps: elementProps,
    }
  }, [
    member.field.level,
    member.field.members,
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.changed,
    member.field.id,
    member.field.focusPath,
    member.field.focused,
    member.field.path,
    member.field.validation,
    member.field.presence,
    handleExpand,
    handleCollapse,
    handleExpandItem,
    handleCollapseItem,
    handleCloseItem,
    handleOpenItem,
    handleChange,
    handleInsert,
    handleMoveItem,
    handleRemoveItem,
    handleAppendItem,
    handlePrependItem,
    handleFocusChildPath,
    renderInput,
    renderField,
    renderItem,
    renderPreview,
    elementProps,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps = useMemo((): ArrayFieldProps => {
    return {
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
      changed: member.field.changed,
      onCollapse: handleCollapse,
      onExpand: handleExpand,
      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      presence: member.field.presence,
      validation: member.field.validation,
      children: renderedInput,
      inputProps,
    }
  }, [
    member.name,
    member.index,
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.id,
    member.field.path,
    member.field.presence,
    member.field.changed,
    member.field.validation,
    member.collapsible,
    member.collapsed,
    handleCollapse,
    handleExpand,
    renderedInput,
    inputProps,
  ])

  return (
    <FormCallbacksProvider
      onFieldGroupSelect={onFieldGroupSelect}
      onChange={handleChange}
      onSetFieldSetCollapsed={onSetFieldSetCollapsed}
      onSetPathCollapsed={onSetPathCollapsed}
      onPathOpen={onPathOpen}
      onPathBlur={onPathBlur}
      onPathFocus={onPathFocus}
    >
      {useMemo(() => renderField(fieldProps), [fieldProps, renderField])}
    </FormCallbacksProvider>
  )
}
