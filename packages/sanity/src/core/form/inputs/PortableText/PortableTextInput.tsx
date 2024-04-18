import {
  type EditorChange,
  type EditorSelection,
  type InvalidValue,
  type Patch as EditorPatch,
  type Patch,
  PortableTextEditor,
  type RangeDecoration,
} from '@sanity/portable-text-editor'
import {useTelemetry} from '@sanity/telemetry/react'
import {isKeySegment, type PortableTextBlock} from '@sanity/types'
import {Box, useToast} from '@sanity/ui'
import {
  type MutableRefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Subject} from 'rxjs'

import {EMPTY_ARRAY} from '../../../util'
import {
  PortableTextInputCollapsed,
  PortableTextInputExpanded,
} from '../../__telemetry__/form.telemetry'
import {SANITY_PATCH_TYPE} from '../../patch'
import {type ArrayOfObjectsItemMember, type ObjectFormNode} from '../../store'
import {type PortableTextInputProps} from '../../types'
import {Compositor, type PortableTextEditorElement} from './Compositor'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'
import {usePortableTextMemberItemsFromProps} from './hooks/usePortableTextMembers'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {
  type PresenceCursorDecorationsHookProps,
  usePresenceCursorDecorations,
} from './presence-cursors'
import {usePatches} from './usePatches'

/** @internal */
export interface PortableTextMemberItem {
  kind: 'annotation' | 'textBlock' | 'objectBlock' | 'inlineObject'
  key: string
  member: ArrayOfObjectsItemMember
  node: ObjectFormNode
  elementRef?: MutableRefObject<PortableTextEditorElement | null>
  input?: ReactNode
}

/**
 * Input component for editing block content
 * ({@link https://github.com/portabletext/portabletext | Portable Text}) in the Sanity Studio.
 *
 * Supports multi-user real-time block content editing on larger documents.
 *
 * This component can be configured and customized extensively.
 * {@link https://www.sanity.io/docs/customizing-the-portable-text-editor | Go to the documentation for more details}.
 *
 * @public
 * @param props - {@link PortableTextInputProps} component props.
 */
export function PortableTextInput(props: PortableTextInputProps): ReactNode {
  const {
    editorRef: editorRefProp,
    elementProps,
    hotkeys,
    markers = EMPTY_ARRAY,
    onChange,
    onCopy,
    onEditorChange,
    onFullScreenChange,
    onInsert,
    onItemRemove,
    onPaste,
    onPathFocus,
    path,
    readOnly,
    rangeDecorations: rangeDecorationsProp,
    renderBlockActions,
    renderCustomMarkers,
    schemaType,
    value,
  } = props

  const {onBlur, ref: elementRef} = elementProps
  const defaultEditorRef = useRef<PortableTextEditor | null>(null)
  const editorRef = editorRefProp || defaultEditorRef

  const presenceCursorDecorations = usePresenceCursorDecorations(
    useMemo(
      (): PresenceCursorDecorationsHookProps => ({
        path: props.path,
      }),
      [props.path],
    ),
  )

  const {subscribe} = usePatches({path})
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const telemetry = useTelemetry()

  const toast = useToast()

  // Memoized patch stream
  const patchSubject: Subject<{
    patches: EditorPatch[]
    snapshot: PortableTextBlock[] | undefined
  }> = useMemo(() => new Subject(), [])
  const patches$ = useMemo(() => patchSubject.asObservable(), [patchSubject])

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => {
      const next = !v
      if (next) {
        telemetry.log(PortableTextInputExpanded)
      } else {
        telemetry.log(PortableTextInputCollapsed)
      }

      onFullScreenChange?.(next)
      return next
    })
  }, [onFullScreenChange, telemetry])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Subscribe to patches
  useEffect(() => {
    return subscribe(({patches, snapshot}): void => {
      patchSubject.next({patches, snapshot})
    })
  }, [patchSubject, subscribe])

  const portableTextMemberItems = usePortableTextMemberItemsFromProps(props)

  // Set active if focused within the editor
  useEffect(() => {
    if (hasFocusWithin) {
      setIsActive(true)
    }
  }, [hasFocusWithin])

  // Report focus on spans with `.text` appended to the reported focusPath.
  // This is done to support the Presentation tool which uses this kind of paths to refer to texts.
  // The PT-input already supports these paths the other way around.
  // It's a bit ugly right here, but it's a rather simple way to support the Presentation tool without
  // having to change the PTE's internals.
  const setFocusPathFromEditorSelection = useCallback(
    (selection: EditorSelection) => {
      const focusPath = selection?.focus.path

      if (!focusPath) return

      // Test if the focusPath is pointing directly to a span
      const isSpanPath =
        focusPath.length === 3 && // A span path is always 3 segments long
        focusPath[1] === 'children' && // Is a child of a block
        isKeySegment(focusPath[2]) && // Contains the key of the child
        !portableTextMemberItems.some(
          (item) => isKeySegment(focusPath[2]) && item.member.key === focusPath[2]._key,
        )

      const nextFocusPath = isSpanPath ? focusPath.concat(['text']) : focusPath

      onPathFocus(nextFocusPath, {
        selection,
      })
    },
    [onPathFocus, portableTextMemberItems],
  )

  const resetSelectionPresence = useCallback(() => {
    onPathFocus(props.path, {
      selection: null,
    })
  }, [onPathFocus, props.path])

  const nextSelectionRef = useRef<EditorSelection | null>(null)
  const hasPendingPatchRef = useRef<boolean>(false)

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          onChange(toFormPatches(change.patches))

          if (nextSelectionRef.current) {
            setFocusPathFromEditorSelection(nextSelectionRef.current)
          }

          hasPendingPatchRef.current = false

          break
        case 'connection':
          if (change.value === 'offline') {
            setIsOffline(true)
          } else if (change.value === 'online') {
            setIsOffline(false)
          }
          break

        case 'patch':
          hasPendingPatchRef.current = true
          break
        case 'selection':
          if (!hasPendingPatchRef.current) {
            setFocusPathFromEditorSelection(change.selection)
            break
          }
          nextSelectionRef.current = change.selection
          break
        case 'focus':
          setIsActive(true)
          setHasFocusWithin(true)
          break
        case 'blur':
          onBlur(change.event)
          setHasFocusWithin(false)

          // When the editor blurs, we reset the presence selection
          // in order to remove the presence cursor for the current user
          // since they no longer have an active selection in the editor.
          resetSelectionPresence()
          break
        case 'undo':
        case 'redo':
          onChange(toFormPatches(change.patches))
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
      if (editorRef.current && onEditorChange) {
        onEditorChange(change, editorRef.current)
      }
    },
    [
      editorRef,
      onBlur,
      onChange,
      onEditorChange,
      resetSelectionPresence,
      setFocusPathFromEditorSelection,
      toast,
    ],
  )

  useEffect(() => {
    setIgnoreValidationError(false)
  }, [value])

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
            readOnly={isOffline || readOnly}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreInvalidValue, invalidValue, isOffline, readOnly])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    }
  }, [editorRef, isActive])

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    const result = [...(rangeDecorationsProp || []), ...presenceCursorDecorations]
    return result.length === 0 ? EMPTY_ARRAY : result
  }, [presenceCursorDecorations, rangeDecorationsProp])

  return (
    <Box ref={elementProps.ref}>
      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && (
        <PortableTextMarkersProvider markers={markers}>
          <PortableTextMemberItemsProvider memberItems={portableTextMemberItems}>
            <PortableTextEditor
              patches$={patches$}
              onChange={handleEditorChange}
              maxBlocks={undefined} // TODO: from schema?
              ref={editorRef}
              readOnly={isOffline || readOnly}
              schemaType={schemaType}
              value={value}
            >
              <Compositor
                {...props}
                elementRef={elementRef}
                hasFocusWithin={hasFocusWithin}
                hotkeys={hotkeys}
                isActive={isActive}
                isFullscreen={isFullscreen}
                onActivate={handleActivate}
                onCopy={onCopy}
                onInsert={onInsert}
                onItemRemove={onItemRemove}
                onPaste={onPaste}
                onToggleFullscreen={handleToggleFullscreen}
                rangeDecorations={rangeDecorations}
                renderBlockActions={renderBlockActions}
                renderCustomMarkers={renderCustomMarkers}
              />
            </PortableTextEditor>
          </PortableTextMemberItemsProvider>
        </PortableTextMarkersProvider>
      )}
    </Box>
  )
}

function toFormPatches(patches: any) {
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE}))
}
