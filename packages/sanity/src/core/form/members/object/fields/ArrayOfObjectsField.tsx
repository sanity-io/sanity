import {type Path, type SchemaType} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {get} from 'lodash'
import {
  createContext,
  type FocusEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type Subscription} from 'rxjs'
import {map, tap} from 'rxjs/operators'

import {useClient} from '../../../../hooks'
import {useResolveInitialValueForType} from '../../../../store'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../../studioClient'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {createProtoArrayValue} from '../../../inputs/arrays/ArrayOfObjectsInput/createProtoArrayValue'
import {insert, type PatchArg, PatchEvent, setIfMissing, unset} from '../../../patch'
import {applyAll} from '../../../patch/applyPatch'
import {type ArrayOfObjectsFormNode, type FieldMember} from '../../../store'
import {useDocumentFieldActions} from '../../../studio/contexts/DocumentFieldActions'
import {FormCallbacksProvider, useFormCallbacks} from '../../../studio/contexts/FormCallbacks'
import {resolveUploader as defaultResolveUploader} from '../../../studio/uploads/resolveUploader'
import {type FileLike, type UploadProgressEvent} from '../../../studio/uploads/types'
import {
  type ArrayFieldProps,
  type ArrayInputInsertEvent,
  type ArrayInputMoveItemEvent,
  type ArrayOfObjectsInputProps,
  type ObjectItem,
  type OnPathFocusPayload,
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
  type UploadEvent,
} from '../../../types'
import {useFormBuilder} from '../../../useFormBuilder'
import {ensureKey} from '../../../utils/ensureKey'
import * as is from '../../../utils/is'
import {createDescriptionId} from '../../common/createDescriptionId'
import {resolveInitialArrayValues} from '../../common/resolveInitialArrayValues'

interface ArrayInputContextProviderValue {
  active: boolean
  /**
   * @hidden
   * @beta */
  selectedItemKeys: string[]
  /**
   * @hidden
   * @beta */
  onItemSelect: (
    itemKeys: string,
    options?: {shiftKey?: boolean; metaKey?: boolean; force?: boolean},
  ) => void
  onSelectAll: () => void
  onSelectNone: () => void

  /**
   * @hidden
   * @beta */
  onItemUnselect: (itemKey: string) => void

  onSelectBegin: () => void
  onSelectEnd: () => void
  /**
   * @hidden
   * @beta */
  onSelectedItemsRemove: () => void
}
const context = createContext<ArrayInputContextProviderValue | undefined>(undefined)

const ArrayInputContextProvider = context.Provider

const EMPTY_SELECTION_STATE: SelectionState<string> = {
  active: false,
  currentSelection: [],
}

export function useParentArrayInput(): ArrayInputContextProviderValue | undefined
export function useParentArrayInput(throwIfMissing: true): ArrayInputContextProviderValue
export function useParentArrayInput(
  throwIfMissing?: boolean,
): ArrayInputContextProviderValue | undefined {
  const ctx = useContext(context)
  if (throwIfMissing && !ctx) {
    throw new Error('Parent array input context missing')
  }
  return ctx
}

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
  const [selectionState, setSelectionState] =
    useState<SelectionState<string>>(EMPTY_SELECTION_STATE)

  const focusRef = useRef<Element & {focus: () => void}>(undefined)
  const uploadSubscriptions = useRef<Record<string, Subscription>>({})

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

      if (!(item as any)?._key || !(refItem as any)?._key) {
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
      if (uploadSubscriptions.current[itemKey]) {
        uploadSubscriptions.current[itemKey].unsubscribe()
        delete uploadSubscriptions.current[itemKey]
      }
      handleChange([unset([{_key: itemKey}])])
    },
    [handleChange],
  )

  const handleUnselectItem = useCallback((itemKey: string) => {
    setSelectionState((current) => unselect(current, itemKey))
  }, [])

  const handleSelectBegin = useCallback(() => {
    setSelectionState((current) => setActive(current, true))
  }, [])

  const handleSelectEnd = useCallback(() => {
    setSelectionState((current) => setActive(current, false))
  }, [])

  const itemKeys = useMemo(() => {
    return member.field.members.map((item) => item.key)
  }, [member.field.members])

  const handleSelectItem = useCallback(
    (itemKey: string, options?: {shiftKey?: boolean; metaKey?: boolean; force?: boolean}) => {
      const range = options?.shiftKey
      setSelectionState((current) => {
        if (options?.force) {
          return select(current, itemKey, true)
        }
        return range
          ? selectRange(current, itemKeys, itemKey)
          : toggleSelect(current, itemKey, options?.metaKey == true)
      })
    },
    [itemKeys],
  )

  const handleSelectAll = useCallback(() => {
    setSelectionState((current) => selectAll(current, itemKeys))
  }, [itemKeys])

  const handleSelectNone = useCallback(() => {
    setSelectionState((current) => unselectAll(current))
  }, [])

  const handleSelectedItemsRemove = useCallback(() => {
    const toRemove = selectionState.currentSelection
    selectionState.currentSelection.forEach((key) => handleRemoveItem(key))
    toast.push({
      title: `Removed ${toRemove.length} item${toRemove.length === 1 ? '' : 's'}`,
      status: 'success',
      closable: true,
    })
  }, [handleRemoveItem, selectionState.currentSelection, toast])

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

  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const formBuilder = useFormBuilder()

  const supportsImageUploads = formBuilder.__internal.image.directUploads
  const supportsFileUploads = formBuilder.__internal.file.directUploads

  useEffect(() => {
    setSelectionState((currentSelectionState) => unselectMissing(currentSelectionState, itemKeys))
  }, [itemKeys])

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

  const handleUpload = useCallback(
    ({file, schemaType, uploader}: UploadEvent) => {
      const item = createProtoArrayValue(schemaType)
      const key = item._key

      handleInsert({
        items: [item],
        position: 'after',
        referenceItem: -1,
        open: false,
      })

      const options = {
        metadata: get(schemaType, 'options.metadata'),
        storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
      }

      const events$ = uploader.upload(client, file, schemaType, options).pipe(
        map((uploadProgressEvent: UploadProgressEvent) =>
          PatchEvent.from(uploadProgressEvent.patches || []).prefixAll({_key: key}),
        ),
        tap((event) => handleChange(event.patches)),
      )

      uploadSubscriptions.current = {
        ...uploadSubscriptions.current,
        [key]: events$.subscribe(),
      }
    },
    [client, handleChange, handleInsert],
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
      selectActive: selectionState.active,
      onItemSelect: handleSelectItem,
      onItemUnselect: handleUnselectItem,
      onSelectAll: handleSelectAll,
      onSelectNone: handleSelectNone,
      onSelectBegin: handleSelectBegin,
      onSelectEnd: handleSelectEnd,
      selectedItemKeys: selectionState.currentSelection,
      onSelectedItemsRemove: handleSelectedItemsRemove,
      onItemAppend: handleItemAppend,
      onItemPrepend: handleItemPrepend,
      onPathFocus: handleFocusChildPath,
      resolveInitialValue,
      onUpload: handleUpload,
      resolveUploader: resolveUploader,
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
    selectionState.active,
    selectionState.currentSelection,
    handleSelectItem,
    handleUnselectItem,
    handleSelectAll,
    handleSelectNone,
    handleSelectBegin,
    handleSelectEnd,
    handleSelectedItemsRemove,
    handleFocusChildPath,
    resolveInitialValue,
    handleUpload,
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
        selectionState={selectionState}
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
  selectionState,
  ...props
}: Omit<ArrayFieldProps, 'renderDefault'> & {
  render: RenderFieldCallback
  selectionState: SelectionState<string>
}) {
  return (
    <ArrayInputContextProvider
      value={{
        active: selectionState.active,
        onSelectedItemsRemove: props.inputProps.onSelectedItemsRemove,
        onItemSelect: props.inputProps.onItemSelect,
        onSelectAll: props.inputProps.onSelectAll,
        onSelectNone: props.inputProps.onSelectNone,
        onItemUnselect: props.inputProps.onItemUnselect,
        onSelectBegin: props.inputProps.onSelectBegin,
        onSelectEnd: props.inputProps.onSelectEnd,
        selectedItemKeys: props.inputProps.selectedItemKeys,
      }}
    >
      {render(props)}
    </ArrayInputContextProvider>
  )
}

interface SelectionState<T> {
  active: boolean
  lastSelected?: T
  currentSelection: T[]
}

function select<T>(state: SelectionState<T>, item: T, additive: boolean) {
  return additive ? selectAdditive(state, item) : selectExclusive(state, item)
}
function toggleSelect<T>(state: SelectionState<T>, item: T, additive: boolean) {
  const selected = state.currentSelection.includes(item)
  return selected && additive ? unselect(state, item) : select(state, item, additive)
}

// this assumes items are not already in array
function selectAdditive<T>(state: SelectionState<T>, item: T): SelectionState<T> {
  const nextCurrentSelection: T[] = []

  let alreadySelected = false
  for (let i = 0; i < state.currentSelection.length; i++) {
    if (state.currentSelection[i] === item) {
      alreadySelected = true
    }
    nextCurrentSelection[i] = state.currentSelection[i]
  }
  if (!alreadySelected) {
    nextCurrentSelection.push(item)
  }

  return {...state, active: true, lastSelected: item, currentSelection: nextCurrentSelection}
}

// this assumes items are not already in array
function selectAll<T>(state: SelectionState<T>, items: T[]): SelectionState<T> {
  return {...state, active: true, lastSelected: undefined, currentSelection: items}
}

// this assumes items are not already in array
function unselectAll<T>(state: SelectionState<T>): SelectionState<T> {
  return {
    ...state,
    lastSelected: undefined,
    currentSelection: [],
  }
}

// this assumes items are not already in array
function selectExclusive<T>(state: SelectionState<T>, item: T): SelectionState<T> {
  return {...state, active: true, lastSelected: item, currentSelection: [item]}
}

// this assumes items are not already in array
function unselect<T>(state: SelectionState<T>, item: T): SelectionState<T> {
  return {
    ...state,
    lastSelected: undefined,
    currentSelection: state.currentSelection.filter((i) => i !== item),
  }
}
// this assumes items are not already in array
function setActive<T>(state: SelectionState<T>, active: boolean): SelectionState<T> {
  return {
    ...state,
    active,
    lastSelected: undefined,
    currentSelection: [],
  }
}

function selectRange<T>(state: SelectionState<T>, items: T[], item: T): SelectionState<T> {
  const fromItem = state.lastSelected || getClosest(state.currentSelection, items, item)

  if (!fromItem) {
    return selectAdditive(state, item)
  }

  const fromIndex = fromItem ? items.indexOf(fromItem) : 0
  const toIndex = items.indexOf(item)

  const toSelect = items.slice(Math.min(fromIndex, toIndex), Math.max(fromIndex, toIndex) + 1)

  return toSelect.reduce((acc, i) => selectAdditive(acc, i), state)
}

function unselectMissing<T>(state: SelectionState<T>, items: T[]): SelectionState<T> {
  return {
    ...state,
    lastSelected:
      state.lastSelected && items.includes(state.lastSelected) ? state.lastSelected : undefined,
    currentSelection: state.currentSelection.filter((selectedItem) => items.includes(selectedItem)),
  }
}

function getClosest<T>(selection: T[], items: T[], item: T) {
  const index = items.indexOf(item)
  let above
  let below
  for (let dist = 0; dist < items.length; dist++) {
    const up = index - dist
    const down = index + dist
    if (!above && selection.includes(items[up])) {
      above = items[up]
    }
    if (!below && selection.includes(items[down])) {
      below = items[down]
    }
    if (above && below) {
      break
    }
  }
  return above || below
}
