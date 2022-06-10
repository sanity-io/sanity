import {ArraySchemaType, ObjectSchemaType} from '@sanity/types'
import {
  EditorChange,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  HotkeyOptions,
  InvalidValue,
  EditorSelection,
} from '@sanity/portable-text-editor'
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  useImperativeHandle,
  createRef,
} from 'react'
import {Subject} from 'rxjs'
import {Box, Text, useToast} from '@sanity/ui'
import scrollIntoView from 'scroll-into-view-if-needed'
import {debounce} from 'lodash'
import {FormPatch as FormBuilderPatch} from '../../patch'
import type {
  ArrayOfObjectsInputProps,
  FieldMember,
  ObjectMember,
  FIXME,
  PortableTextMarker,
  RenderCustomMarkers,
} from '../../types'
import {ArrayOfObjectsItemMember, ObjectFormNode} from '../../types'
import {EMPTY_ARRAY} from '../../utils/empty'
import {isMemberArrayOfObjects} from '../../members/fields/asserters'
import {Compositor, PortableTextEditorElement} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {usePatches} from './usePatches'
import {VisibleOnFocusButton} from './VisibleOnFocusButton'
import {RenderBlockActionsCallback} from './types'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'

export type ObjectMemberType = ArrayOfObjectsItemMember<
  ObjectFormNode<
    {
      [x: string]: unknown
    },
    ObjectSchemaType
  >
>

export interface PortableTextMemberItem {
  key: string
  member: ObjectMemberType
  elementRef?: React.MutableRefObject<PortableTextEditorElement> | undefined
}

export function isFieldMember(member: ObjectMember): member is FieldMember<ObjectFormNode> {
  return member.kind === 'field'
}

/**
 * @alpha
 */
export interface PortableTextInputProps
  extends ArrayOfObjectsInputProps<PortableTextBlock, ArraySchemaType> {
  hotkeys?: HotkeyOptions
  markers?: PortableTextMarker[]
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  renderBlockActions?: RenderBlockActionsCallback
  renderCustomMarkers?: RenderCustomMarkers
}

/**
 * The root Portable Text Input component
 *
 * @alpha
 */
export function PortableTextInput(props: PortableTextInputProps) {
  const {
    focused,
    focusPath,
    focusRef,
    hotkeys,
    markers = EMPTY_ARRAY,
    members,
    onChange,
    onCopy,
    onFocusPath,
    onInsert,
    onPaste,
    path,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    schemaType: type,
    value,
  } = props

  // Make the PTE focusable from the outside
  useImperativeHandle(focusRef, () => ({
    focus() {
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    },
  }))

  const {subscribe} = usePatches({path})
  const editorRef = useRef<PortableTextEditor | null>(null)
  const [hasFocus, setHasFocus] = useState(false)
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const toast = useToast()
  const portableTextMemberItemsRef: React.MutableRefObject<PortableTextMemberItem[]> = useRef([])

  // Memoized patch stream
  const remotePatchSubject: Subject<EditorPatch> = useMemo(() => new Subject(), [])
  const remotePatch$ = useMemo(() => remotePatchSubject.asObservable(), [remotePatchSubject])

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v)
    if (editorRef.current) PortableTextEditor.focus(editorRef.current)
  }, [editorRef])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Subscribe to incoming patches
  useEffect(() => {
    return subscribe(({patches}): void => {
      const patchSelection =
        patches && patches.length > 0 && patches.filter((patch) => patch.origin !== 'local')

      if (patchSelection) {
        patchSelection.map((patch) => remotePatchSubject.next(patch))
      }
    })
  }, [remotePatchSubject, subscribe])

  // Populate the portableTextMembers Map
  const portableTextMemberItems: PortableTextMemberItem[] = useMemo(() => {
    const ptMembers = members.flatMap((m) => {
      if (m.kind === 'error') {
        return []
      }
      let returned: ObjectMemberType[] = []
      // Object blocks or normal blocks with validation
      if (m.item.schemaType.name !== 'block' || m.item.validation.length > 0) {
        returned.push(m)
      }
      // Inline objects
      const childrenField = m.item.members.find((f) => f.kind === 'field' && f.name === 'children')
      if (
        childrenField &&
        childrenField.kind === 'field' &&
        isMemberArrayOfObjects(childrenField)
      ) {
        returned = [
          ...returned,
          ...childrenField.field.members.filter(
            (cM): cM is ObjectMemberType => cM.kind === 'item' && cM.item.schemaType.name !== 'span'
          ),
        ]
      }
      // Markdefs
      const markDefArrayMember = m.item.members
        .filter(isFieldMember)
        .find((f) => f.name === 'markDefs')

      if (markDefArrayMember) {
        returned = [
          ...returned,
          ...(markDefArrayMember.field.members as unknown as ObjectMemberType[]), // TODO: fix correct typing on this
        ]
      }
      return returned
    })
    // Create new items or update existing ones
    const items = ptMembers.map((r) => {
      const key = JSON.stringify(r.item.path.slice(path.length))
      const existingItem = portableTextMemberItemsRef.current.find((ref) => ref.key === key)
      if (existingItem) {
        existingItem.member = r
        return existingItem
      }
      return {
        key,
        member: r,
        elementRef: createRef<PortableTextEditorElement>(),
      }
    })
    portableTextMemberItemsRef.current = items
    return items
  }, [members, path])

  // Sets the focusPath from editor selection (when typing, moving the cursor, clicking around)
  // This doesn't neeed to be immediate, so debounce it as it impacts performance.
  const setFocusPathThrottled = useMemo(
    () =>
      debounce(
        (sel: EditorSelection) => {
          if (sel && hasFocus) onFocusPath(sel.focus.path)
        },
        1000,
        {trailing: true, leading: true}
      ),
    [hasFocus, onFocusPath]
  )

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          onChange(change.patches as FormBuilderPatch[])
          break
        case 'selection':
          setFocusPathThrottled(change.selection)
          break
        case 'focus':
          setHasFocus(true)
          break
        case 'blur':
          setHasFocus(false)
          break
        case 'undo':
        case 'redo':
          onChange(change.patches as FormBuilderPatch[])
          break
        case 'invalidValue':
          setInvalidValue(change)
          break
        case 'error':
          toast.push({
            status: change.level,
            description: change.description,
          })
          break
        default:
      }
    },
    [onChange, toast, setFocusPathThrottled]
  )

  const handleFocusSkipperClick = useCallback(() => {
    if (editorRef.current) {
      PortableTextEditor.focus(editorRef.current)
    }
  }, [editorRef])

  const handleIgnoreInvalidValue = useCallback((): void => {
    setIgnoreValidationError(true)
  }, [])

  const respondToInvalidContent = useMemo(() => {
    if (invalidValue && invalidValue.resolution) {
      return (
        <Box marginBottom={2}>
          <RespondToInvalidContent
            onChange={handleEditorChange}
            onIgnore={handleIgnoreInvalidValue}
            resolution={invalidValue.resolution}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreInvalidValue, invalidValue])

  // Scroll *the field* (not the editor content) into view if we have focus in the field.
  // For scrolling to particular editor content see useScrollToFocusFromOutside and useScrollSelectionIntoView in
  // the Compositor component.
  useEffect(() => {
    if (focusPath && focusPath.length > 0 && innerElementRef.current) {
      scrollIntoView(innerElementRef.current, {
        scrollMode: 'if-needed',
      })
    }
  }, [focusPath])

  return (
    <Box ref={innerElementRef}>
      {!readOnly && (
        <VisibleOnFocusButton onClick={handleFocusSkipperClick}>
          <Text>Go to content</Text>
        </VisibleOnFocusButton>
      )}

      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && (
        <PortableTextMarkersProvider markers={markers}>
          <PortableTextMemberItemsProvider memberItems={portableTextMemberItems}>
            <PortableTextEditor
              ref={editorRef}
              incomingPatches$={remotePatch$}
              onChange={handleEditorChange}
              maxBlocks={undefined} // TODO: from schema?
              readOnly={readOnly}
              type={type as FIXME}
              value={value}
            >
              <Compositor
                {...props}
                focused={focused}
                focusPath={focusPath}
                hasFocus={hasFocus}
                hotkeys={hotkeys}
                isFullscreen={isFullscreen}
                onChange={onChange}
                onCopy={onCopy}
                onInsert={onInsert}
                onPaste={onPaste}
                onToggleFullscreen={handleToggleFullscreen}
                renderBlockActions={renderBlockActions}
                renderCustomMarkers={renderCustomMarkers}
                value={value}
              />
            </PortableTextEditor>
          </PortableTextMemberItemsProvider>
        </PortableTextMarkersProvider>
      )}
    </Box>
  )
}
