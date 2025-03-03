import {
  type EditorChange,
  type EditorEmittedEvent,
  EditorProvider,
  type EditorSelection,
  type InvalidValue,
  type OnPasteFn,
  type Patch,
  type PortableTextEditableProps,
  PortableTextEditor,
  type RangeDecoration,
  type RenderEditableFunction,
  useEditor,
  usePortableTextEditor,
} from '@portabletext/editor'
import {EventListenerPlugin, MarkdownPlugin} from '@portabletext/editor/plugins'
import {useTelemetry} from '@sanity/telemetry/react'
import {isKeySegment, type Path, type PortableTextBlock} from '@sanity/types'
import {Box, Flex, Text, useToast} from '@sanity/ui'
import {randomKey} from '@sanity/util/content'
import {sortBy} from 'lodash'
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

import {useTranslation} from '../../../i18n'
import {EMPTY_ARRAY} from '../../../util'
import {
  PortableTextInputCollapsed,
  PortableTextInputExpanded,
} from '../../__telemetry__/form.telemetry'
import {SANITY_PATCH_TYPE} from '../../patch'
import {type ArrayOfObjectsItemMember, type ObjectFormNode} from '../../store'
import {immutableReconcile} from '../../store/utils/immutableReconcile'
import {type ResolvedUploader} from '../../studio/uploads/types'
import {type PortableTextInputProps} from '../../types'
import {extractPastedFiles} from '../common/fileTarget/utils/extractFiles'
import {Compositor} from './Compositor'
import {PortableTextMarkersProvider} from './contexts/PortableTextMarkers'
import {PortableTextMemberItemsProvider} from './contexts/PortableTextMembers'
import {usePortableTextMemberItemsFromProps} from './hooks/usePortableTextMembers'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {
  type PresenceCursorDecorationsHookProps,
  usePresenceCursorDecorations,
} from './presence-cursors'
import {getUploadCandidates} from './upload/helpers'
import {usePatches} from './usePatches'

interface UploadTask {
  file: File
  uploaderCandidates: ResolvedUploader[]
}

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
/** @public */
export interface RenderPortableTextInputEditableProps extends PortableTextEditableProps {
  renderDefault: RenderEditableFunction
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
    renderEditable,
    schemaType,
    value,
    resolveUploader,
    onUpload,
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

  const {t} = useTranslation()
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen ?? false)
  const [isActive, setIsActive] = useState(initialActive ?? false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const [ready, setReady] = useState(false)
  const telemetry = useTelemetry()

  const toast = useToast()

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
    const result = [...(rangeDecorationsProp || []), ...presenceCursorDecorations]
    const reconciled = immutableReconcile(previousRangeDecorations.current, result)
    previousRangeDecorations.current = reconciled
    return reconciled
  }, [presenceCursorDecorations, rangeDecorationsProp])

  const uploadFile = useCallback(
    (file: File, resolvedUploader: ResolvedUploader) => {
      const {type, uploader} = resolvedUploader
      onUpload?.({file, schemaType: type, uploader})
    },
    [onUpload],
  )

  const handleFiles = useCallback(
    (files: File[]) => {
      if (!resolveUploader) {
        return
      }
      const tasks: UploadTask[] = files.map((file) => ({
        file,
        uploaderCandidates: getUploadCandidates(schemaType.of, resolveUploader, file),
      }))
      const readyTasks = tasks.filter((task) => task.uploaderCandidates.length > 0)
      const rejected: UploadTask[] = tasks.filter((task) => task.uploaderCandidates.length === 0)

      if (rejected.length > 0) {
        toast.push({
          closable: true,
          status: 'warning',
          title: t('inputs.array.error.cannot-upload-unable-to-convert', {
            count: rejected.length,
          }),
          description: rejected.map((task, i) => (
            <Flex key={i} gap={2} padding={2}>
              <Box>
                <Text weight="medium">{task.file.name}</Text>
              </Box>
              <Box>
                <Text size={1}>({task.file.type})</Text>
              </Box>
            </Flex>
          )),
        })
      }

      // todo: consider if we should to ask the user here
      // the list of candidates is sorted by their priority and the first one is selected
      readyTasks.forEach((task) => {
        uploadFile(
          task.file,
          // eslint-disable-next-line max-nested-callbacks
          sortBy(task.uploaderCandidates, (candidate) => candidate.uploader.priority)[0],
        )
      })
    },
    [toast, resolveUploader, schemaType, uploadFile, t],
  )

  const handlePaste: OnPasteFn = useCallback(
    (input) => {
      const {event} = input

      // Some applications may put both text and files on the clipboard when content is copied.
      // If we have both text and html on the clipboard, just ignore the files if this is a paste event.
      // Drop events will most probably be files so skip this test for those.
      const eventType = event.type === 'paste' ? 'paste' : 'drop'
      const hasHtml = !!event.clipboardData.getData('text/html')
      const hasText = !!event.clipboardData.getData('text/plain')
      if (eventType === 'paste' && hasHtml && hasText) {
        return onPaste?.(input)
      }

      extractPastedFiles(event.clipboardData)
        .then((files) => {
          return files.length > 0 ? files : []
        })
        .then((files) => {
          handleFiles(files)
        })
      return onPaste?.(input)
    },
    [handleFiles, onPaste],
  )

  return (
    <Box>
      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && (
        <PortableTextMarkersProvider markers={markers}>
          <PortableTextMemberItemsProvider memberItems={portableTextMemberItems}>
            <EditorProvider
              initialConfig={{
                initialValue: value,
                readOnly: readOnly || !ready,
                keyGenerator,
                schema: schemaType,
              }}
            >
              <EditorChangePlugin onChange={handleEditorChange} />
              <EditorRefPlugin ref={editorRef} />
              <PatchesPlugin path={path} />
              <UpdateReadOnlyPlugin readOnly={readOnly || !ready} />
              <UpdateValuePlugin value={value} />
              <MarkdownPlugin
                config={{
                  boldDecorator: ({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'strong')?.value,
                  codeDecorator: ({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'code')?.value,
                  italicDecorator: ({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'em')?.value,
                  strikeThroughDecorator: ({schema}) =>
                    schema.decorators.find((decorator) => decorator.value === 'strike-through')
                      ?.value,
                  defaultStyle: ({schema}) =>
                    schema.styles.find((style) => style.value === 'normal')?.value,
                  blockquoteStyle: ({schema}) =>
                    schema.styles.find((style) => style.value === 'blockquote')?.value,
                  headingStyle: ({schema, level}) =>
                    schema.styles.find((style) => style.value === `h${level}`)?.value,
                  orderedListStyle: ({schema}) =>
                    schema.lists.find((list) => list.value === 'number')?.value,
                  unorderedListStyle: ({schema}) =>
                    schema.lists.find((list) => list.value === 'bullet')?.value,
                }}
              />
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
                onPaste={handlePaste}
                onToggleFullscreen={handleToggleFullscreen}
                rangeDecorations={rangeDecorations}
                readOnly={readOnly || !ready}
                renderBlockActions={renderBlockActions}
                renderCustomMarkers={renderCustomMarkers}
                renderEditable={renderEditable}
              />
            </EditorProvider>
          </PortableTextMemberItemsProvider>
        </PortableTextMarkersProvider>
      )}
    </Box>
  )
}

/**
 * Custom PTE plugin that translates `EditorEmittedEvent`s to `EditorChange`s
 */
function EditorChangePlugin(props: {onChange: (change: EditorChange) => void}) {
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
          props.onChange(event)
          break
        case 'patch': {
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
 */
function UpdateReadOnlyPlugin(props: {readOnly: boolean}) {
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
