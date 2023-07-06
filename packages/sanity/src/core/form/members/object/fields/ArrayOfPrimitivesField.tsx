import React, {useCallback, useMemo, useRef, useState} from 'react'
import {
  ArraySchemaType,
  BooleanSchemaType,
  isBooleanSchemaType,
  isNumberSchemaType,
  isStringSchemaType,
  NumberSchemaType,
  SchemaType,
  StringSchemaType,
} from '@sanity/types'
import {filter, map, tap} from 'rxjs/operators'
import {Subscription} from 'rxjs'
import {FIXME} from '../../../../FIXME'
import {ArrayOfPrimitivesFormNode, FieldMember} from '../../../store'
import {
  ArrayOfObjectsInputProps,
  ArrayOfPrimitivesFieldProps,
  ArrayOfPrimitivesInputProps,
  ArrayInputMoveItemEvent,
  RenderArrayOfPrimitivesItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
  UploadEvent,
  RenderBlockCallback,
  RenderAnnotationCallback,
} from '../../../types'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {insert, PatchArg, PatchEvent, set, setIfMissing, unset} from '../../../patch'
import {PrimitiveValue} from '../../../inputs/arrays/ArrayOfPrimitivesInput/types'
import {Uploader, UploaderResolver, UploadProgressEvent} from '../../../studio'
import {useClient} from '../../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {readAsText} from '../../../studio/uploads/file/readAsText'
import {accepts} from '../../../studio/uploads/accepts'
import {applyAll} from '../../../patch/applyPatch'
import {
  FieldActionMenu,
  FieldActionsProvider,
  FieldActionsResolver,
  useFieldActions,
} from '../../../field'
import {useFormPublishedId} from '../../../useFormPublishedId'
import {useFormBuilder} from '../../../useFormBuilder'
import {DocumentFieldActionNode} from '../../../../config'

function move<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice()
  const val = copy[from]
  copy.splice(from, 1)
  copy.splice(to, 0, val)
  return copy
}

/**
 * @example
 * Inserts "hello" at the beginning
 * ```ts
 * insertAfter(-1, ["one", "two"], "hello")
 * // => ["hello", "one", "two"]
 * ```
 */
function insertAfter<T>(
  /**
   * index to insert item after. An index of -1 will prepend the item
   */
  index: number,
  /**
   * the array to insert the item into
   */
  arr: T[],
  /**
   * the item to insert
   */
  items: T[]
): T[] {
  const copy = arr.slice()
  copy.splice(index + 1, 0, ...items)
  return copy
}
function isStringNumeric(input: string) {
  return /^\d+$/.test(input)
}

type PrimitiveSchemaType = NumberSchemaType | BooleanSchemaType | StringSchemaType

function convertToSchemaType(line: string, candidates: SchemaType[]) {
  let acceptsBooleans = false
  let acceptsNumbers = false
  let acceptsStrings = false
  candidates.forEach((candidate) => {
    if (isBooleanSchemaType(candidate)) {
      acceptsBooleans = true
    }
    if (isStringSchemaType(candidate)) {
      acceptsStrings = true
    }
    if (isNumberSchemaType(candidate)) {
      acceptsNumbers = true
    }
  })

  if (acceptsBooleans && (line === 'true' || line === 'false')) return line === 'true'
  if (acceptsNumbers && isStringNumeric(line)) return Number(line)
  return acceptsStrings ? line : undefined
}

function createPlainTextUploader(itemTypes: PrimitiveSchemaType[]): Uploader<PrimitiveSchemaType> {
  return {
    priority: 0,
    accepts: 'text/*',
    type: 'string',
    upload(client, file) {
      return readAsText(file, 'utf-8').pipe(
        map((textContent) =>
          textContent
            ?.split(/[\n\r]/)
            .map((value) => convertToSchemaType(value, itemTypes))
            .filter((v) => v !== undefined)
        ),
        filter((v: unknown[] | undefined): v is unknown[] => Array.isArray(v)),
        map((lines: unknown[]) => ({
          type: 'uploadProgress',
          patches: [insert(lines, 'after', [-1])],
        }))
      )
    },
  }
}

/**
 * Responsible for creating inputProps and fieldProps to pass to ´renderInput´ and ´renderField´ for an array input
 * Note: "ArrayField" in this context means an object field of an array type
 * @param props - Component props
 */
export function ArrayOfPrimitivesField(props: {
  member: FieldMember<ArrayOfPrimitivesFormNode>
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfPrimitivesItemCallback
  renderPreview: RenderPreviewCallback
}) {
  const {
    onPathBlur,
    onPathFocus,
    onChange,
    onPathOpen,
    onSetPathCollapsed,
    onSetFieldSetCollapsed,
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

  const {
    field: {actions: fieldActions},
  } = useFormBuilder().__internal
  const documentId = useFormPublishedId()
  const [fieldActionNodes, setFieldActionNodes] = useState<DocumentFieldActionNode[]>([])

  const focusRef = useRef<Element & {focus: () => void}>()
  const uploadSubscriptions = useRef<Subscription>()
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)

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
      const patches = PatchEvent.from(event).patches
      // if the patch is an unset patch that targets an item in the array (as opposed to unsetting a field somewhere deeper)
      const isRemovingLastItem = patches.some(
        (patch) => patch.type === 'unset' && patch.path.length === 1
      )

      if (isRemovingLastItem) {
        // apply the patch to the current value
        const result = applyAll(member.field.value || [], patches)

        // if the result is an empty array
        if (Array.isArray(result) && !result.length) {
          // then unset the array field
          onChange(PatchEvent.from(unset([member.name])))
          return
        }
      }
      // otherwise apply the patch
      onChange(PatchEvent.from(event).prepend(setIfMissing([])).prefixAll(member.name))
    },
    [onChange, member.name, member.field.value]
  )

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetPathCollapsed(member.field.path, collapsed)
    },
    [onSetPathCollapsed, member.field.path]
  )

  const handleCollapse = useCallback(() => {
    onSetPathCollapsed(member.field.path, true)
  }, [onSetPathCollapsed, member.field.path])
  const handleExpand = useCallback(() => {
    onSetPathCollapsed(member.field.path, false)
  }, [onSetPathCollapsed, member.field.path])

  const setValue = useCallback(
    (nextValue: PrimitiveValue[]) => {
      handleChange(nextValue.length === 0 ? unset() : set(nextValue))
    },
    [handleChange]
  )

  const handleMoveItem = useCallback(
    (event: ArrayInputMoveItemEvent) => {
      const {value = []} = member.field
      if (event.fromIndex === event.toIndex) {
        return
      }

      setValue(move(value, event.fromIndex, event.toIndex))
    },
    [member.field, setValue]
  )

  const handleAppend = useCallback(
    (itemValue: PrimitiveValue) => {
      const {value = []} = member.field
      setValue(value.concat(itemValue))
    },
    [member.field, setValue]
  )

  const handlePrepend = useCallback(
    (itemValue: PrimitiveValue) => {
      const {value = []} = member.field
      setValue([itemValue].concat(value || []))
    },
    [member.field, setValue]
  )

  const handleInsert = useCallback(
    (event: {items: PrimitiveValue[]; position: 'before' | 'after'; referenceIndex: number}) => {
      const {value = []} = member.field

      const insertIndex = event.referenceIndex + (event.position === 'before' ? -1 : 0)
      setValue(insertAfter(insertIndex, value, event.items))
    },
    [member.field, setValue]
  )

  const handleRemoveItem = useCallback(
    (index: number) => {
      handleChange(unset([index]))
    },
    [handleChange]
  )

  const handleFocusIndex = useCallback(
    (index: number) => {
      onPathFocus(member.field.path.concat([index]))
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

  const plainTextUploader = useMemo(
    () => createPlainTextUploader(member.field.schemaType.of as PrimitiveSchemaType[]),
    [member.field.schemaType.of]
  )

  const resolveUploader: UploaderResolver<PrimitiveSchemaType> = useCallback(
    (schemaType, file) => (accepts(file, 'text/*') ? plainTextUploader : null),
    [plainTextUploader]
  )

  const handleUpload = useCallback(
    ({file, schemaType, uploader}: UploadEvent) => {
      const events$ = uploader.upload(client, file, schemaType).pipe(
        map((uploadProgressEvent: UploadProgressEvent) =>
          PatchEvent.from(uploadProgressEvent.patches || [])
        ),
        tap((event) => handleChange(event.patches))
      )

      if (uploadSubscriptions.current) {
        uploadSubscriptions.current.unsubscribe()
      }
      uploadSubscriptions.current = events$.subscribe()
    },
    [client, handleChange]
  )

  const inputProps = useMemo((): Omit<ArrayOfPrimitivesInputProps, 'renderDefault'> => {
    return {
      level: member.field.level,
      members: member.field.members,
      value: member.field.value as any,
      readOnly: member.field.readOnly,
      onSetCollapsed: handleSetCollapsed,
      schemaType: member.field.schemaType,
      changed: member.field.changed,
      id: member.field.id,
      elementProps,
      path: member.field.path,
      focusPath: member.field.focusPath,
      focused: member.field.focused,
      onChange: handleChange,
      onInsert: handleInsert,
      onMoveItem: handleMoveItem,
      onItemRemove: handleRemoveItem,
      onItemAppend: handleAppend,
      onItemPrepend: handlePrepend,
      validation: member.field.validation,
      presence: member.field.presence,
      resolveUploader,
      onUpload: handleUpload,
      renderAnnotation,
      renderBlock,
      renderInlineBlock,
      renderInput,
      renderItem,
      onIndexFocus: handleFocusIndex,
      renderPreview,
    }
  }, [
    member.field.level,
    member.field.members,
    member.field.value,
    member.field.readOnly,
    member.field.schemaType,
    member.field.changed,
    member.field.id,
    member.field.path,
    member.field.focusPath,
    member.field.focused,
    member.field.validation,
    member.field.presence,
    handleSetCollapsed,
    elementProps,
    handleChange,
    handleInsert,
    handleMoveItem,
    handleRemoveItem,
    handleAppend,
    handlePrepend,
    resolveUploader,
    handleUpload,
    renderAnnotation,
    renderBlock,
    renderInlineBlock,
    renderInput,
    renderItem,
    handleFocusIndex,
    renderPreview,
  ])

  const renderedInput = useMemo(() => renderInput(inputProps), [inputProps, renderInput])

  const fieldProps: Omit<ArrayOfPrimitivesFieldProps, 'renderDefault'> = useMemo(() => {
    return {
      actions:
        fieldActionNodes.length > 0 ? (
          <FieldActionMenu focused={member.field.focused} nodes={fieldActionNodes} />
        ) : undefined,
      name: member.name,
      index: member.index,
      level: member.field.level,
      value: member.field.value,
      title: member.field.schemaType.title,
      description: member.field.schemaType.description,
      collapsible: member.collapsible,
      collapsed: member.collapsed,
      onExpand: handleExpand,
      changed: member.field.changed,
      onCollapse: handleCollapse,
      schemaType: member.field.schemaType,
      inputId: member.field.id,
      path: member.field.path,
      presence: member.field.presence,
      validation: member.field.validation,
      children: renderedInput,
      inputProps: inputProps as ArrayOfPrimitivesInputProps,
    }
  }, [
    fieldActionNodes,
    member.field.focused,
    member.field.level,
    member.field.value,
    member.field.schemaType,
    member.field.changed,
    member.field.id,
    member.field.path,
    member.field.presence,
    member.field.validation,
    member.name,
    member.index,
    member.collapsible,
    member.collapsed,
    handleExpand,
    handleCollapse,
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
      {documentId && fieldActions.length > 0 && (
        <FieldActionsResolver
          actions={fieldActions}
          documentId={documentId}
          documentType={member.field.schemaType.name}
          onActions={setFieldActionNodes}
          path={member.field.path}
          schemaType={member.field.schemaType}
        />
      )}

      <FieldActionsProvider actions={fieldActionNodes} path={member.field.path}>
        {useMemo(() => renderField(fieldProps as FIXME), [fieldProps, renderField])}
      </FieldActionsProvider>
    </FormCallbacksProvider>
  )
}
