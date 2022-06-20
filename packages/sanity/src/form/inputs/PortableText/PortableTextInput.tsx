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
import {ArrayOfObjectsItemMember, ObjectFormNode} from '../../store'
import type {
  ArrayOfObjectsInputProps,
  FIXME,
  PortableTextMarker,
  RenderCustomMarkers,
} from '../../types'
import {EMPTY_ARRAY} from '../../utils/empty'
import {isMemberArrayOfObjects} from '../../members/fields/asserters'
import {pathToString} from '../../../field/paths'
import {Compositor, PortableTextEditorElement} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {usePatches} from './usePatches'
import {VisibleOnFocusButton} from './VisibleOnFocusButton'
import {RenderBlockActionsCallback} from './types'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'
import {_isArrayOfObjectsFieldMember, _isBlockType} from './_helpers'

export type PTObjectMember = ArrayOfObjectsItemMember<
  ObjectFormNode<
    {
      [x: string]: unknown
    },
    ObjectSchemaType
  >
>
export interface PortableTextMemberItem {
  kind: 'annotation' | 'textBlock' | 'objectBlock' | 'inlineObject'
  key: string
  member: PTObjectMember
  node: ObjectFormNode
  elementRef?: React.MutableRefObject<PortableTextEditorElement> | undefined
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
  }, [])

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
    const result: {
      kind: PortableTextMemberItem['kind']
      member: PTObjectMember
      node: ObjectFormNode
    }[] = []

    for (const member of members) {
      if (member.kind === 'item') {
        if (!_isBlockType(member.item.schemaType)) {
          result.push({kind: 'objectBlock', member, node: member.item})
        } else if (member.item.validation.length > 0 || member.item.changed) {
          // Only text blocks that have validation or changes
          result.push({kind: 'textBlock', member, node: member.item})
        }

        if (_isBlockType(member.item.schemaType)) {
          // Inline objects
          const childrenField = member.item.members.find(
            (f) => f.kind === 'field' && f.name === 'children'
          )

          if (
            childrenField &&
            childrenField.kind === 'field' &&
            isMemberArrayOfObjects(childrenField)
          ) {
            // eslint-disable-next-line max-depth
            for (const child of childrenField.field.members) {
              // eslint-disable-next-line max-depth
              if (child.kind === 'item' && child.item.schemaType.name !== 'span') {
                result.push({kind: 'inlineObject', member: child, node: child.item})
              }
            }
          }

          // Markdefs
          const markDefArrayMember = member.item.members
            .filter(_isArrayOfObjectsFieldMember)
            .find((f) => f.name === 'markDefs')

          if (markDefArrayMember) {
            // eslint-disable-next-line max-depth
            for (const child of markDefArrayMember.field.members) {
              // eslint-disable-next-line max-depth
              if (child.kind === 'item' && child.item.schemaType.jsonType === 'object') {
                result.push({
                  kind: 'annotation',
                  member: child,
                  node: child.item,
                })
              }
            }
          }
        }
      }
    }

    const items: PortableTextMemberItem[] = result.map((r) => {
      const key = pathToString(r.node.path.slice(path.length))
      const existingItem = portableTextMemberItemsRef.current.find((ref) => ref.key === key)

      if (existingItem) {
        existingItem.member = r.member
        existingItem.node = r.node
        return existingItem
      }

      return {
        kind: r.kind,
        key,
        member: r.member,
        node: r.node,
        elementRef: createRef<PortableTextEditorElement>(),
      }
    })

    portableTextMemberItemsRef.current = items

    return items
  }, [members, path])

  // Sets the focusPath from editor selection (when typing, moving the cursor, clicking around)
  // This doesn't need to be immediate, so debounce it as it impacts performance.
  const setFocusPathDebounced = useMemo(
    () =>
      debounce(
        (sel: EditorSelection) => {
          if (sel && hasFocus) onFocusPath(sel.focus.path)
        },
        500,
        {trailing: true, leading: false}
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
          setFocusPathDebounced(change.selection)
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
    [onChange, toast, setFocusPathDebounced]
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
