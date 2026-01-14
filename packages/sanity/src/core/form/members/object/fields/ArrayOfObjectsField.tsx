import {
  type AssetFromSource,
  type AssetSourceUploader,
  type Path,
  type SchemaType,
} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {noop} from 'lodash-es'
import {
  type FocusEvent,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {tap} from 'rxjs/operators'

import {useTranslation} from '../../../../i18n'
import {useResolveInitialValueForType} from '../../../../store'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {createProtoArrayValue} from '../../../inputs/arrays/ArrayOfObjectsInput/createProtoArrayValue'
import {handleSelectAssetFromSource as handleSelectAssetFromSourceShared} from '../../../inputs/files/common/assetSource'
import {insert, type PatchArg, PatchEvent, set, setIfMissing, unset} from '../../../patch'
import {applyAll} from '../../../patch/applyPatch'
import {type ArrayOfObjectsFormNode, type FieldMember} from '../../../store'
import {useDocumentFieldActions} from '../../../studio/contexts/DocumentFieldActions'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {UPLOAD_STATUS_KEY} from '../../../studio/uploads/constants'
import {resolveUploader as defaultResolveUploader} from '../../../studio/uploads/resolveUploader'
import {type FileLike} from '../../../studio/uploads/types'
import {createInitialUploadPatches} from '../../../studio/uploads/utils'
import {
  type ArrayFieldProps,
  type ArrayInputInsertEvent,
  type ArrayInputMoveItemEvent,
  type ArrayOfObjectsInputProps,
  type InputOnSelectFileFunctionProps,
  type ObjectItem,
  type OnPathFocusPayload,
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {ensureKey} from '../../../utils/ensureKey'
import * as is from '../../../utils/is'
import {createDescriptionId} from '../../common/createDescriptionId'
import {resolveInitialArrayValues} from '../../common/resolveInitialArrayValues'

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an array input
 * Note: "ArrayField" in this context means an object field of an array type
 * @param props - Component props
 */
export function ArrayOfObjectsField(props: {
  member: FieldMember<ArrayOfObjectsFormNode>
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
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

  const fieldActions = useDocumentFieldActions()

  const focusRef = useRef<Element & {focus: () => void}>(undefined)
  const assetSourceUploaderRef = useRef<
    Record<string, {unsubscribe: () => void; uploader: AssetSourceUploader}>
  >({})

  // Some asset sources require a component to serve the upload flow (like Media Library)
  const [assetSourceUploadComponents, setAssetSourceUploadComponents] = useState<ReactElement[]>([])

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  const handleFocus = useCallback(
    (event: FocusEvent) => {
      // We want to handle focus when the array input *itself* element receives
      // focus, not when a child element receives focus, but React has decided
      // to let focus bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (event.currentTarget === event.target && event.currentTarget === focusRef.current) {
        onPathFocus(member.field.path)
      }
    },
    [member.field.path, onPathFocus],
  )

  const handleBlur = useCallback(
    (event: FocusEvent) => {
      // We want to handle blur when the array input *itself* element receives
      // blur, not when a child element receives blur, but React has decided
      // to let focus events bubble, so this workaround is needed
      // Background: https://github.com/facebook/react/issues/6410#issuecomment-671915381
      if (event.currentTarget === event.target && event.currentTarget === focusRef.current) {
        onPathBlur(member.field.path)
      }
    },
    [member.field.path, onPathBlur],
  )

  const valueRef = useRef(member.field.value)
  useEffect(() => {
    valueRef.current = member.field.value
  }, [member.field.value])

  const handleChange = useCallback(
    (event: PatchEvent | PatchArg) => {
      const patches = PatchEvent.from(event).patches
      // if the patch is an unset patch that targets an item in the array (as opposed to unsetting a field somewhere deeper)
      const isRemovingLastItem = patches.some(
        (patch) => patch.type === 'unset' && patch.path.length === 1,
      )

      if (isRemovingLastItem) {
        // apply the patch to the current value
        valueRef.current = applyAll(valueRef.current || [], patches)

        // if the result is an empty array
        if (Array.isArray(valueRef.current) && !valueRef.current.length) {
          // then unset the array field
          onChange(PatchEvent.from(unset([member.name])))
          return
        }
      }
      // otherwise apply the patch
      onChange(PatchEvent.from(event).prepend(setIfMissing([])).prefixAll(member.name))
    },
    [onChange, member.name, valueRef],
  )
  const resolveInitialValue = useResolveInitialValueForType()

  const toast = useToast()
  const {t} = useTranslation()

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
    [onSetPathCollapsed, member.field.path],
  )

  const handleExpandItem = useCallback(
    (itemKey: string) => {
      onSetPathCollapsed(member.field.path.concat({_key: itemKey}), false)
    },
    [onSetPathCollapsed, member.field.path],
  )

  const handleOpenItem = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onSetPathCollapsed(path, false)
    },
    [onPathOpen, onSetPathCollapsed],
  )

  const handleCloseItem = useCallback(() => {
    onPathOpen(member.field.path)
    onSetPathCollapsed(member.field.path, true)
  }, [onPathOpen, member.field.path, onSetPathCollapsed])

  const handleInsert = useCallback(
    (event: ArrayInputInsertEvent<ObjectItem>) => {
      if (event.items.length === 0) {
        throw new Error('Insert event should include at least one item')
      }
      const itemsWithKeys = event.items.map((item) => ensureKey(item))

      handleChange(PatchEvent.from([insert(itemsWithKeys, event.position, [event.referenceItem])]))

      const focusItemKey = itemsWithKeys[0]._key
      const itemPath = [...member.field.path, {_key: focusItemKey}]
      // Set focus at the first item (todo: verify that this is the expected/better behavior when adding multiple items)
      onPathFocus(itemPath)

      const shouldOpen = event.open !== false

      if (event.skipInitialValue) {
        if (shouldOpen) {
          handleOpenItem(itemPath)
        }
      } else {
        resolveInitialArrayValues(itemsWithKeys, member.field.schemaType, resolveInitialValue)
          .pipe(
            tap((result) => {
              if (result.type === 'patch') {
                handleChange(result.patches)
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
      handleChange,
      handleOpenItem,
      member.field.path,
      member.field.schemaType,
      onPathFocus,
      resolveInitialValue,
      toast,
    ],
  )

  const handleMoveItem = useCallback(
    (event: ArrayInputMoveItemEvent) => {
      const value = member.field.value
      const item = value?.[event.fromIndex] as any
      const refItem = value?.[event.toIndex] as any
      if (event.fromIndex === event.toIndex) {
        return
      }

      if (!item?._key || !refItem?._key) {
        console.error(
          'Neither the item you are moving nor the item you are moving to have a key. Cannot continue.',
        )

        return
      }

      handleChange([
        unset([{_key: item._key}]),
        insert([item], event.fromIndex > event.toIndex ? 'before' : 'after', [
          {_key: refItem._key},
        ]),
      ])
    },
    [handleChange, member.field.value],
  )

  const handleItemPrepend = useCallback(
    (item: ObjectItem) => {
      handleInsert({
        items: [item],
        position: 'before',
        referenceItem: 0,
      })
    },
    [handleInsert],
  )

  const handleItemAppend = useCallback(
    (item: ObjectItem) => {
      handleInsert({
        items: [item],
        position: 'after',
        referenceItem: -1,
      })
    },
    [handleInsert],
  )

  const handleRemoveItem = useCallback(
    (itemKey: string) => {
      if (assetSourceUploaderRef.current[itemKey]) {
        assetSourceUploaderRef.current[itemKey].unsubscribe()
        delete assetSourceUploaderRef.current[itemKey]
      }
      handleChange([unset([{_key: itemKey}])])
    },
    [handleChange],
  )

  const handleFocusChildPath = useCallback(
    (path: Path, payload?: OnPathFocusPayload) => {
      onPathFocus(member.field.path.concat(path), payload)
    },
    [member.field.path, onPathFocus],
  )

  const elementProps = useMemo(
    (): ArrayOfObjectsInputProps['elementProps'] => ({
      'onBlur': handleBlur,
      'onFocus': handleFocus,
      'id': member.field.id,
      'ref': focusRef,
      'aria-describedby': createDescriptionId(member.field.id, member.field.schemaType.description),
    }),
    [handleBlur, handleFocus, member.field.id, member.field.schemaType.description],
  )

  const formBuilder = useFormBuilder()

  const supportsImageUploads = formBuilder.__internal.image.directUploads
  const supportsFileUploads = formBuilder.__internal.file.directUploads

  const resolveUploader = useCallback(
    (type: SchemaType, file: FileLike) => {
      if (is.type('image', type) && !supportsImageUploads) {
        return null
      }
      if (is.type('file', type) && !supportsFileUploads) {
        return null
      }

      return defaultResolveUploader(type, file)
    },
    [supportsFileUploads, supportsImageUploads],
  )

  const handleSelectAssetsFromSource = useCallback(
    (assets: AssetFromSource[], schemaType: any, key: string) => {
      handleSelectAssetFromSourceShared({
        assetsFromSource: assets,
        onChange: (patches) =>
          handleChange(PatchEvent.from(patches as PatchEvent).prefixAll({_key: key})),
        type: schemaType,
        resolveUploader,
        uploadWith: undefined,
      })
    },
    [handleChange, resolveUploader],
  )

  const handleSelectFile = useCallback(
    ({assetSource, schemaType, file}: InputOnSelectFileFunctionProps) => {
      if (assetSource.Uploader) {
        const item = createProtoArrayValue(schemaType)
        const key = item._key

        try {
          handleInsert({
            items: [item],
            position: 'after',
            referenceItem: -1,
            open: false,
          })

          handleChange(PatchEvent.from(createInitialUploadPatches(file)).prefixAll({_key: key}))

          const uploader = new assetSource.Uploader()

          setAssetSourceUploadComponents((prev) => {
            const AssetSourceComponent = assetSource.component
            const assetSourceComponent = (
              <AssetSourceComponent
                key={key}
                assetSource={assetSource}
                action="upload"
                onSelect={(assets) => handleSelectAssetsFromSource(assets, schemaType, key)}
                accept="*/*"
                onClose={noop}
                selectedAssets={[]}
                selectionType="single"
                uploader={uploader}
              />
            )
            return [...prev, assetSourceComponent]
          })
          const unsubscribe = uploader.subscribe((event) => {
            switch (event.type) {
              case 'progress':
                handleChange(
                  PatchEvent.from([
                    set(Math.max(2, event.progress), [{_key: key}, UPLOAD_STATUS_KEY, 'progress']),
                    set(new Date().toISOString(), [{_key: key}, UPLOAD_STATUS_KEY, 'updatedAt']),
                  ]),
                )
                break
              case 'error':
                event.files.forEach((_file) => {
                  console.error(_file.error)
                })
                toast.push({
                  status: 'error',
                  description: t('asset-sources.common.uploader.upload-failed.description'),
                  title: t('asset-sources.common.uploader.upload-failed.title'),
                })
                break
              case 'all-complete':
                handleChange(PatchEvent.from([unset([{_key: key}, UPLOAD_STATUS_KEY])]))
                break
              default:
            }
          })
          assetSourceUploaderRef.current = {
            ...assetSourceUploaderRef.current,
            [key]: {
              unsubscribe: () => {
                // Remove the asset source component when upload is done or aborted
                setAssetSourceUploadComponents((prev) => prev.filter((el) => el.key !== key))
                return unsubscribe
              },
              uploader,
            },
          }
          uploader.upload([file], {
            schemaType,
            onChange: (patches) => {
              handleChange(PatchEvent.from(patches as PatchEvent).prefixAll({_key: key}))
            },
          })
        } catch (err) {
          console.error(err)
          assetSourceUploaderRef.current?.[key]?.unsubscribe()
          handleChange(PatchEvent.from([unset(['_upload'])]).prefixAll({_key: key}))
          handleRemoveItem(key)
        }
      }
    },
    [handleInsert, handleSelectAssetsFromSource, handleChange, toast, t, handleRemoveItem],
  )

  const inputProps = useMemo((): Omit<ArrayOfObjectsInputProps, 'renderDefault'> => {
    return {
      level: member.field.level,
      members: member.field.members,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      schemaType: member.field.schemaType,
      changed: member.field.changed,
      __unstable_computeDiff: member.field.__unstable_computeDiff,
      compareValue: member.field.compareValue,
      hasUpstreamVersion: member.field.hasUpstreamVersion,
      id: member.field.id,
      onItemExpand: handleExpandItem,
      onItemCollapse: handleCollapseItem,
      onItemClose: handleCloseItem,
      onItemOpen: handleOpenItem,
      displayInlineChanges: member.field.displayInlineChanges ?? false,

      focusPath: member.field.focusPath,
      focused: member.field.focused,

      path: member.field.path,

      onChange: handleChange,
      onInsert: handleInsert,
      onItemMove: handleMoveItem,
      onItemRemove: handleRemoveItem,
      onItemAppend: handleItemAppend,
      onItemPrepend: handleItemPrepend,
      onPathFocus: handleFocusChildPath,
      resolveInitialValue,
      onSelectFile: handleSelectFile,
      resolveUploader,
      validation: member.field.validation,
      presence: member.field.presence,
      renderAnnotation,
      renderBlock,
      renderInlineBlock,
      renderInput,
      renderField,
      renderItem,
      renderPreview,
      elementProps,
    }
  }, [
    member.field.level,
    member.field.members,
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.changed,
    member.field.__unstable_computeDiff,
    member.field.compareValue,
    member.field.id,
    member.field.focusPath,
    member.field.focused,
    member.field.path,
    member.field.validation,
    member.field.presence,
    member.field.hasUpstreamVersion,
    member.field.displayInlineChanges,
    handleExpandItem,
    handleCollapseItem,
    handleCloseItem,
    handleOpenItem,
    handleChange,
    handleInsert,
    handleMoveItem,
    handleRemoveItem,
    handleItemAppend,
    handleItemPrepend,
    handleFocusChildPath,
    resolveInitialValue,
    handleSelectFile,
    resolveUploader,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderInput,
    renderField,
    renderItem,
    renderPreview,
    elementProps,
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
      <RenderField
        actions={fieldActions}
        name={member.name}
        index={member.index}
        level={member.field.level}
        value={member.field.value}
        title={member.field.schemaType.title}
        description={member.field.schemaType.description}
        collapsible={member.collapsible}
        collapsed={member.collapsed}
        changed={member.field.changed}
        onCollapse={handleCollapse}
        onExpand={handleExpand}
        schemaType={member.field.schemaType}
        inputId={member.field.id}
        path={member.field.path}
        presence={member.field.presence}
        validation={member.field.validation}
        inputProps={inputProps as ArrayOfObjectsInputProps}
        render={renderField}
      >
        <RenderInput {...inputProps} render={renderInput} />
      </RenderField>
      {assetSourceUploadComponents}
    </FormCallbacksProvider>
  )
}

// The RenderInput and RenderField wrappers workaround the strict refs checks in React Compiler
function RenderInput({
  render,
  ...props
}: Omit<ArrayOfObjectsInputProps, 'renderDefault'> & {
  render: RenderInputCallback
}) {
  return render(props)
}
function RenderField({
  render,
  ...props
}: Omit<ArrayFieldProps, 'renderDefault'> & {
  render: RenderFieldCallback
}) {
  return render(props)
}
