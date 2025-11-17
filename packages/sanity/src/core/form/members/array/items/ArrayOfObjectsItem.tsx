import {useTelemetry} from '@sanity/telemetry/react'
import {type Path} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {useCallback, useMemo, useRef} from 'react'
import {tap} from 'rxjs/operators'

import {pathToString} from '../../../../field/paths/helpers'
import {useTranslation} from '../../../../i18n'
import {useResolveInitialValueForType} from '../../../../store'
import {useCopyPaste} from '../../../../studio'
import {useGetFormValue} from '../../../contexts/GetFormValue'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {insert, type PatchArg, PatchEvent, setIfMissing, unset} from '../../../patch'
import {type ArrayOfObjectsItemMember} from '../../../store'
import {isEmptyItem} from '../../../store/utils/isEmptyItem'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {
  CreateAppendedObject,
  CreatePrependedObject,
  EditedObject,
  NavigatedToViaArrayList,
  RemovedObject,
} from '../../../studio/tree-editing/__telemetry__/nestedObjects.telemetry'
import {useEnhancedObjectDialog} from '../../../studio/tree-editing/context/enabled/useEnhancedObjectDialog'
import {
  type ArrayInputCopyEvent,
  type ArrayInputInsertEvent,
  type FormDocumentValue,
  type ObjectInputProps,
  type ObjectItem,
  type ObjectItemProps,
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../types'
import {createProtoValue} from '../../../utils/createProtoValue'
import {ensureKey} from '../../../utils/ensureKey'
import {createDescriptionId} from '../../common/createDescriptionId'
import {resolveInitialArrayValues} from '../../common/resolveInitialArrayValues'

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
  const focusRef = useRef<{focus: () => void}>(undefined)
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
  const {t} = useTranslation()

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
  const getFormValue = useGetFormValue()
  const {onCopy} = useCopyPaste()
  const telemetry = useTelemetry()
  const {enabled: enhancedObjectDialogEnabled} = useEnhancedObjectDialog()

  useDidUpdate(member.item.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const onRemove = useCallback(() => {
    telemetry.log(RemovedObject, {
      path: pathToString(member.item.path),
      origin: enhancedObjectDialogEnabled ? 'nested-object' : 'default',
    })

    onChange(PatchEvent.from([unset([{_key: member.key}])]))
  }, [enhancedObjectDialogEnabled, member.item.path, member.key, onChange, telemetry])

  const handleOpenItem = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onSetPathCollapsed(path, false)
    },
    [onPathOpen, onSetPathCollapsed],
  )
  const toast = useToast()

  const telemetryInsertSiblingsTelemetry = useCallback(
    (event: Omit<ArrayInputInsertEvent<ObjectItem>, 'referenceItem'>) => {
      if (event.position === 'before') {
        telemetry.log(CreatePrependedObject, {
          path: pathToString(member.item.path),
          origin: enhancedObjectDialogEnabled ? 'nested-object' : 'default',
        })
      } else {
        telemetry.log(CreateAppendedObject, {
          path: pathToString(member.item.path),
          origin: enhancedObjectDialogEnabled ? 'nested-object' : 'default',
        })
      }
    },
    [enhancedObjectDialogEnabled, member.item.path, telemetry],
  )

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
          telemetryInsertSiblingsTelemetry(event)
        }
      } else {
        resolveInitialArrayValues(itemsWithKeys, member.parentSchemaType, resolveInitialValue)
          .pipe(
            tap((result) => {
              if (result.type === 'patch') {
                onChange(PatchEvent.from(result.patches))
              } else {
                toast.push({
                  title: t('inputs.array.error.cannot-resolve-initial-value-title'),
                  description: t('inputs.array.error.cannot-resolve-initial-value-description', {
                    schemaTypeTitle: result.schemaType.title,
                    errorMessage: result.error.message,
                  }),
                  status: 'error',
                })
              }
            }),
          )
          .subscribe({
            complete: () => {
              if (shouldOpen) {
                handleOpenItem(itemPath)
                telemetryInsertSiblingsTelemetry(event)
              }
            },
          })
      }
    },
    [
      onChange,
      member.key,
      member.item.path,
      member.parentSchemaType,
      onPathFocus,
      handleOpenItem,
      telemetryInsertSiblingsTelemetry,
      resolveInitialValue,
      toast,
      t,
    ],
  )

  const handleCopy = useCallback(
    (_: Omit<ArrayInputCopyEvent<ObjectItem>, 'referenceItem'>) => {
      const documentValue = getFormValue([]) as FormDocumentValue
      void onCopy(member.item.path, documentValue, {
        context: {source: 'arrayItem'},
        patchType: 'append',
      })
    },
    [getFormValue, onCopy, member.item.path],
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
      telemetry.log(EditedObject, {
        path: pathToString(member.item.path),
        origin: enhancedObjectDialogEnabled ? 'nested-object' : 'default',
      })

      onChange(
        PatchEvent.from(event)
          .prepend(setIfMissing(createProtoValue(member.item.schemaType)))
          .prefixAll({_key: member.key}),
      )
    },
    [
      enhancedObjectDialogEnabled,
      onChange,
      member.item.schemaType,
      member.item.path,
      member.key,
      telemetry,
    ],
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
    telemetry.log(NavigatedToViaArrayList, {
      path: pathToString(member.item.path),
      origin: enhancedObjectDialogEnabled ? 'nested-object' : 'default',
    })

    onPathOpen(member.item.path)
  }, [enhancedObjectDialogEnabled, onPathOpen, member.item.path, telemetry])

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
      'onBlur': handleBlur,
      'onFocus': handleFocus,
      'id': member.item.id,
      'ref': focusRef,
      'aria-describedby': createDescriptionId(member.item.id, member.item.schemaType.description),
    }),
    [handleBlur, handleFocus, member.item.id, member.item.schemaType.description],
  )

  const inputProps = useMemo((): Omit<ObjectInputProps, 'renderDefault'> => {
    return {
      changed: member.item.changed,
      __unstable_computeDiff: member.item.__unstable_computeDiff,
      hasUpstreamVersion: member.item.hasUpstreamVersion,
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
      compareValue: member.item.compareValue,
      elementProps: elementProps,
      displayInlineChanges: member.item.displayInlineChanges ?? false,
    }
  }, [
    elementProps,
    member.item.hasUpstreamVersion,
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
    member.item.__unstable_computeDiff,
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
    member.item.compareValue,
    member.item.displayInlineChanges,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
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
      <RenderItem
        key={member.key}
        index={member.index}
        level={member.item.level}
        value={member.item.value}
        compareValue={member.item.compareValue}
        __unstable_computeDiff={member.item.__unstable_computeDiff}
        hasUpstreamVersion={member.item.hasUpstreamVersion}
        title={member.item.schemaType.title}
        description={member.item.schemaType.description}
        collapsible={member.collapsible}
        collapsed={member.collapsed}
        schemaType={member.item.schemaType}
        parentSchemaType={member.parentSchemaType}
        onInsert={handleInsert}
        onCopy={handleCopy}
        onRemove={onRemove}
        presence={member.item.presence}
        validation={member.item.validation}
        open={member.open}
        onOpen={handleOpen}
        onClose={handleClose}
        onExpand={handleExpand}
        onCollapse={handleCollapse}
        readOnly={member.item.readOnly}
        focused={member.item.focused}
        onFocus={handleFocus}
        onBlur={handleBlur}
        inputId={member.item.id}
        path={member.item.path}
        changed={member.item.changed}
        inputProps={inputProps}
        render={renderItem}
      >
        <RenderInput {...inputProps} render={renderInput} />
      </RenderItem>
    </FormCallbacksProvider>
  )
}

// The RenderInput and RenderItem wrappers workaround the strict refs checks in React Compiler
function RenderInput({
  render,
  ...props
}: Omit<ObjectInputProps, 'renderDefault'> & {
  render: RenderInputCallback
}) {
  return render(props)
}
function RenderItem({
  render,
  ...props
}: Omit<ObjectItemProps, 'renderDefault'> & {
  render: RenderArrayOfObjectsItemCallback
}) {
  return render(props)
}
