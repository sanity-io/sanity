import {
  type EditorEmittedEvent,
  EditorProvider,
  type EditorSelection,
  type Patch,
  PortableTextEditor,
  type RangeDecoration,
  useEditor,
  usePortableTextEditor,
} from '@portabletext/editor'
import {EventListenerPlugin} from '@portabletext/editor/plugins'
import {sanitySchemaToPortableTextSchema} from '@portabletext/sanity-bridge'
import {useTelemetry} from '@sanity/telemetry/react'
import {isKeySegment, type Path, type PortableTextBlock} from '@sanity/types'
import {Box, useToast} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {
  forwardRef,
  type ReactNode,
  startTransition,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'

import {usePerspective} from '../../../perspective/usePerspective'
import {EMPTY_ARRAY} from '../../../util'
import {pathToString} from '../../../validation/util/pathToString'
import {
  PortableTextInputCollapsed,
  PortableTextInputExpanded,
} from '../../__telemetry__/form.telemetry'
import {SANITY_PATCH_TYPE} from '../../patch'
import {type ArrayOfObjectsItemMember, type ObjectFormNode} from '../../store'
import {immutableReconcile} from '../../store/utils/immutableReconcile'
import {type EditorChange, type PortableTextInputProps} from '../../types'
import {Compositor} from './Compositor'
import {useFullscreenPTE} from './contexts/fullscreen'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'
import {PortableTextMemberSchemaTypesProvider} from './contexts/PortableTextMemberSchemaTypes'
import {
  type PortableTextOptimisticDiffApi,
  useOptimisticPortableTextDiff,
} from './diff/useOptimisticPortableTextDiff'
import {usePortableTextMemberItemsFromProps} from './hooks/usePortableTextMembers'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {PortableTextEditorPlugins} from './object/Plugins'
import {
  type PresenceCursorDecorationsHookProps,
  usePresenceCursorDecorations,
} from './presence-cursors'
import {usePatches} from './usePatches'

function keyGenerator() {
  return randomKey(12)
}

/**
 * `EditorProvider` doesn't have a `ref` prop. This custom PTE plugin takes
 * care of imperatively forwarding that ref.
 */
const EditorRefPlugin = forwardRef<PortableTextEditor | null>((_, ref) => {
  const portableTextEditor = usePortableTextEditor()

  const portableTextEditorRef = useRef(portableTextEditor)

  useImperativeHandle(ref, () => portableTextEditorRef.current, [])

  return null
})
EditorRefPlugin.displayName = 'EditorRefPlugin'

/** @internal */
export interface PortableTextMemberItem {
  kind: 'annotation' | 'textBlock' | 'objectBlock' | 'inlineObject'
  key: string
  member: ArrayOfObjectsItemMember
  node: ObjectFormNode
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
    initialActive,
    initialFullscreen,
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
    displayInlineChanges,
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

  const {selectedPerspective} = usePerspective()

  const {rangeDecorations: diffRangeDecorations, onOptimisticChange} =
    useOptimisticPortableTextDiff({
      upstreamValue: props.hasUpstreamVersion ? props.compareValue : [],
      definitiveValue: value,
      perspective: selectedPerspective,
      displayInlineChanges,
    })

  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<Extract<
    EditorChange,
    {type: 'invalidValue'}
  > | null>(null)
  const [isActive, setIsActive] = useState(initialActive ?? true)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const [ready, setReady] = useState(false)
  const telemetry = useTelemetry()

  // Use fullscreen context to persist state across navigation
  const {getFullscreenPath, setFullscreenPath} = useFullscreenPTE()
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(getFullscreenPath(path)) || (initialFullscreen ?? false),
  )

  const hasSyncedInitialFullscreenRef = useRef(false)
  const previousPathRef = useRef(path)

  useEffect(() => {
    // If the initial fullscreen state is set and the path is not in the fullscreen context, set it
    // This is to ensure that the fullscreen state is persisted across navigation
    // This is especially important for nested fullscreen PTEs
    if (!hasSyncedInitialFullscreenRef.current && initialFullscreen && !getFullscreenPath(path)) {
      hasSyncedInitialFullscreenRef.current = true
      setFullscreenPath(path, true)
    }
  }, [initialFullscreen, path, getFullscreenPath, setFullscreenPath])

  // Sync local isFullscreen state with the fullscreen context
  // This ensures the state updates when the fullscreen path changes from elsewhere
  useEffect(() => {
    // Check if the fullscreen path value has actually changed
    if (pathToString(previousPathRef.current) !== pathToString(path)) {
      previousPathRef.current = path
      const currentFullscreenPath = getFullscreenPath(path)

      setIsFullscreen(Boolean(currentFullscreenPath))
    }
  }, [getFullscreenPath, path])

  const toast = useToast()

  const handleToggleFullscreen = useCallback(() => {
    const next = !isFullscreen
    if (next) {
      telemetry.log(PortableTextInputExpanded)
    } else {
      telemetry.log(PortableTextInputCollapsed)
    }
    setFullscreenPath(path, next)
    onFullScreenChange?.(next)
    setIsFullscreen(next)
  }, [telemetry, path, setFullscreenPath, onFullScreenChange, isFullscreen])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  const portableTextMemberItems = usePortableTextMemberItemsFromProps(props)

  // Set active if focused within the editor
  useEffect(() => {
    if (hasFocusWithin) {
      setIsActive(true)
    }
  }, [hasFocusWithin])

  const setFocusPathFromEditorSelection = useCallback(
    (nextSelection: EditorSelection) => {
      const focusPath = nextSelection?.focus.path
      if (!focusPath) return

      // Report focus on spans with `.text` appended to the reported focusPath.
      // This is done to support the Presentation tool which uses this kind of paths to refer to texts.
      // The PT-input already supports these paths the other way around.
      // It's a bit ugly right here, but it's a rather simple way to support the Presentation tool without
      // having to change the PTE's internals.
      const isSpanPath =
        focusPath.length === 3 && // A span path is always 3 segments long
        focusPath[1] === 'children' && // Is a child of a block
        isKeySegment(focusPath[2]) && // Contains the key of the child
        !portableTextMemberItems.some(
          (item) => isKeySegment(focusPath[2]) && item.member.key === focusPath[2]._key,
        )
      const nextFocusPath = isSpanPath ? focusPath.concat(['text']) : focusPath

      // Must called in a transition useTrackFocusPath hook
      // will try to effectuate a focusPath that is different from what currently is the editor focusPath
      startTransition(() => {
        onPathFocus(nextFocusPath, {
          selection: nextSelection,
        })
      })
    },
    [onPathFocus, portableTextMemberItems],
  )

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          onChange(toFormPatches(change.patches))
          break
        case 'selection':
          setFocusPathFromEditorSelection(change.selection)
          break
        case 'focus':
          setIsActive(true)
          setHasFocusWithin(true)
          break
        case 'blur':
          onBlur(change.event)
          setHasFocusWithin(false)
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
        case 'ready':
          setReady(true)
          break
        default:
      }
      if (editorRef.current && onEditorChange) {
        onEditorChange(change, editorRef.current)
      }
    },
    [editorRef, onEditorChange, onChange, setFocusPathFromEditorSelection, onBlur, toast],
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
            readOnly={readOnly}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreInvalidValue, invalidValue, readOnly])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      if (editorRef.current) {
        PortableTextEditor.focus(editorRef.current)
      }
    }
  }, [editorRef, isActive])

  const previousRangeDecorations = useRef<RangeDecoration[]>([])

  const rangeDecorations = useMemo((): RangeDecoration[] => {
    // Portable Text Editor cannot reliably handle overlapping range decorations. In the worst case,
    // this can cause bugs such as diff segments being repeated, which is highly confusing.
    //
    // Range decorations cannot simply be merged, because they may rely on the `onMoved` API, which
    // expects each instance to be treated discretely.
    //
    // To avoid confusion, no other range decorations are rendered while inline diffs are switched on.
    //
    // Users are able to quickly toggle inline diffs on and off from the Studio UI, so this is a
    // reasonable trade-off for now.
    const result: RangeDecoration[] = displayInlineChanges
      ? diffRangeDecorations
      : [...(rangeDecorationsProp || []), ...presenceCursorDecorations]

    // eslint-disable-next-line react-hooks/refs -- @todo fix later, requires research to avoid perf degradation, for now "this is fine"
    const reconciled = immutableReconcile(previousRangeDecorations.current, result)
    // eslint-disable-next-line react-hooks/refs -- see above
    previousRangeDecorations.current = reconciled
    return reconciled
  }, [diffRangeDecorations, displayInlineChanges, presenceCursorDecorations, rangeDecorationsProp])

  return (
    <Box>
      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && (
        <PortableTextMemberSchemaTypesProvider schemaType={schemaType}>
          <PortableTextMarkersProvider markers={markers}>
            <PortableTextMemberItemsProvider memberItems={portableTextMemberItems}>
              <EditorProvider
                initialConfig={{
                  initialValue: value,
                  readOnly: readOnly || !ready,
                  keyGenerator,
                  schemaDefinition: sanitySchemaToPortableTextSchema(schemaType),
                }}
              >
                <EditorChangePlugin
                  onChange={handleEditorChange}
                  onOptimisticChange={onOptimisticChange}
                />
                <EditorRefPlugin ref={editorRef} />
                <PatchesPlugin path={path} />
                <UpdateReadOnlyPlugin readOnly={readOnly || !ready} />
                <UpdateValuePlugin value={value} />
                <PortableTextEditorPlugins schemaType={schemaType} />
                <Compositor
                  {...props}
                  elementRef={elementRef}
                  hasFocusWithin={hasFocusWithin}
                  hotkeys={hotkeys}
                  isActive={isActive}
                  isFullscreen={isFullscreen}
                  onActivate={handleActivate}
                  onItemRemove={onItemRemove}
                  onCopy={onCopy}
                  onInsert={onInsert}
                  onPaste={onPaste}
                  onToggleFullscreen={handleToggleFullscreen}
                  rangeDecorations={rangeDecorations}
                  readOnly={readOnly || !ready}
                  renderBlockActions={renderBlockActions}
                  renderCustomMarkers={renderCustomMarkers}
                />
              </EditorProvider>
            </PortableTextMemberItemsProvider>
          </PortableTextMarkersProvider>
        </PortableTextMemberSchemaTypesProvider>
      )}
    </Box>
  )
}

/**
 * Custom PTE plugin that translates `EditorEmittedEvent`s to `EditorChange`s
 *
 * @internal
 */
function EditorChangePlugin(
  props: {
    onChange: (change: EditorChange) => void
  } & Pick<PortableTextOptimisticDiffApi, 'onOptimisticChange'>,
) {
  const handleEditorEvent = useCallback(
    (event: EditorEmittedEvent) => {
      switch (event.type) {
        case 'blurred':
          props.onChange({
            type: 'blur',
            event: event.event,
          })
          break
        case 'error':
          props.onChange({
            type: 'error',
            name: event.name,
            level: 'warning',
            description: event.description,
          })
          break
        case 'focused':
          props.onChange({
            type: 'focus',
            event: event.event,
          })
          break
        case 'loading':
          props.onChange({
            type: 'loading',
            isLoading: true,
          })
          break
        case 'done loading':
          props.onChange({
            type: 'loading',
            isLoading: false,
          })
          break
        case 'invalid value':
          props.onChange({
            type: 'invalidValue',
            resolution: event.resolution,
            value: event.value,
          })
          break
        case 'mutation':
          props.onChange({
            type: 'mutation',
            snapshot: event.value,
            patches: event.patches,
          })
          break
        case 'patch': {
          if (event.patch.type === 'diffMatchPatch' && event.patch.origin === 'local') {
            props.onOptimisticChange(event.patch)
          }
          props.onChange(event)
          break
        }
        case 'ready':
          props.onChange(event)
          break
        case 'selection': {
          props.onChange(event)
          break
        }
        case 'value changed':
          props.onChange({
            type: 'value',
            value: event.value,
          })
          break
        default:
      }
    },
    [props],
  )

  return <EventListenerPlugin on={handleEditorEvent} />
}

/**
 * Custom PTE plugin that sets up a patch subscription and sends patches to the
 * editor.
 */
function PatchesPlugin(props: {path: Path}) {
  const editor = useEditor()
  const {subscribe} = usePatches({path: props.path})

  useEffect(() => {
    const unsubscribe = subscribe(({patches, snapshot}): void => {
      editor.send({type: 'patches', patches, snapshot})
    })

    return () => {
      return unsubscribe()
    }
  }, [editor, subscribe])

  return null
}

/**
 * `EditorProvider` doesn't have a `value` prop. Instead, this custom PTE
 * plugin listens for the prop change and sends an `update value` event to the
 * editor.
 */
function UpdateValuePlugin(props: {value: Array<PortableTextBlock> | undefined}) {
  const editor = useEditor()

  useEffect(() => {
    editor.send({
      type: 'update value',
      value: props.value,
    })
  }, [editor, props.value])

  return null
}

/**
 * `EditorProvider` doesn't have a `readOnly` prop. Instead, this custom PTE
 * plugin listens for the prop change and sends a `toggle readOnly` event to
 * the editor.
 *
 * @internal
 */
export function UpdateReadOnlyPlugin(props: {readOnly: boolean}) {
  const editor = useEditor()

  useEffect(() => {
    editor.send({
      type: 'update readOnly',
      readOnly: props.readOnly,
    })
  }, [editor, props.readOnly])

  return null
}

function toFormPatches(patches: any) {
  return patches.map((p: Patch) => ({...p, patchType: SANITY_PATCH_TYPE}))
}
