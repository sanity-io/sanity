import {ArraySchemaType, Path} from '@sanity/types'
import {
  EditorChange,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  HotkeyOptions,
  EditorSelection,
  InvalidValue,
} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react'
import {Subject} from 'rxjs'
import {Box, Text, useForwardedRef, useToast} from '@sanity/ui'
import scrollIntoView from 'scroll-into-view-if-needed'
import {FormPatch as FormBuilderPatch} from '../../patch'
import type {
  ArrayOfObjectsInputProps,
  FIXME,
  PortableTextMarker,
  RenderCustomMarkers,
} from '../../types'
import {withPatchSubscriber} from '../../utils/withPatchSubscriber'
import {EMPTY_ARRAY} from '../../utils/empty'
import {RenderBlockActions} from './types'
import {Compositor} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {VisibleOnFocusButton} from './VisibleOnFocusButton'

type PatchWithOrigin = FormBuilderPatch & {
  origin: 'local' | 'remote' | 'internal'
  timestamp: Date
}

type PatchSubscribe = (subscribeFn: PatchSubscriber) => () => void
type PatchSubscriber = ({
  patches,
}: {
  patches: PatchWithOrigin[]
  snapshot: PortableTextBlock[] | undefined
}) => void

/**
 * @alpha
 */
export interface PortableTextInputProps
  extends ArrayOfObjectsInputProps<PortableTextBlock, ArraySchemaType> {
  hotkeys?: HotkeyOptions
  markers?: PortableTextMarker[]
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
}

/**
 * An outer React PureComponent Class purely to satisfy the form-builder's need for 'blur' and 'focus' class methods.
 *
 * @alpha
 */
export const PortableTextInput = withPatchSubscriber(
  class PortableTextInput extends React.PureComponent<
    PortableTextInputProps & {children: React.ReactNode; subscribe: PatchSubscribe}
  > {
    editorRef: React.RefObject<PortableTextEditor> = React.createRef()
    focus() {
      if (this.editorRef.current) {
        PortableTextEditor.focus(this.editorRef.current)
      }
    }
    blur() {
      if (this.editorRef.current) {
        PortableTextEditor.blur(this.editorRef.current)
      }
    }
    render() {
      return <PortableTextInputController {...this.props} ref={this.editorRef} />
    }
  }
) as React.ComponentType as React.ComponentType<PortableTextInputProps>

const PortableTextInputController = React.forwardRef(function PortableTextInputController(
  props: PortableTextInputProps & {subscribe: PatchSubscribe},
  ref: React.ForwardedRef<PortableTextEditor>
) {
  const {
    focusPath,
    focused,
    hotkeys,
    markers = [],
    members,
    onChange,
    onCopy,
    onInsert,
    onPaste,
    onSetCollapsed,
    renderBlockActions,
    renderCustomMarkers,
    renderItem,
    subscribe,
    schemaType: type,
    value,
    onBlur,
    onFocus,
    onFocusPath,
    readOnly,
  } = props

  const forwardedRef = useForwardedRef(ref)

  const [hasFocus, setHasFocus] = useState(false)
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState<InvalidValue | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toast = useToast()

  // Memoized patch stream
  const patches$: Subject<EditorPatch> = useMemo(() => new Subject(), [])
  const patchObservable = useMemo(() => patches$.asObservable(), [patches$])

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v)
    if (forwardedRef.current) PortableTextEditor.focus(forwardedRef.current)
  }, [forwardedRef])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Handle incoming patches from withPatchSubscriber HOC
  const handleDocumentPatches = useCallback(
    ({patches}: {patches: PatchWithOrigin[]; snapshot: PortableTextBlock[] | undefined}): void => {
      const patchSelection =
        patches && patches.length > 0 && patches.filter((patch) => patch.origin !== 'local')
      if (patchSelection) {
        patchSelection.map((patch) => patches$.next(patch))
      }
    },
    [patches$]
  )

  // Subscribe to incoming patches
  useEffect(() => {
    const unsubscribe = subscribe(handleDocumentPatches)
    return () => unsubscribe()
  }, [handleDocumentPatches, subscribe])

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          setTimeout(() => {
            onChange(change.patches as FormBuilderPatch[])
          })
          break
        case 'selection':
          if (
            forwardedRef.current &&
            shouldSetEditorFormBuilderFocus(
              forwardedRef.current,
              change.selection,
              focusPath || EMPTY_ARRAY
            )
          ) {
            if (change.selection?.focus.path) {
              onFocusPath(change.selection?.focus.path)
            }
          }
          break
        case 'focus':
          setHasFocus(true)
          onFocusPath(
            (forwardedRef.current &&
              PortableTextEditor.getSelection(forwardedRef.current)?.focus.path) ||
              []
          )

          break
        case 'blur':
          setHasFocus(false)
          break
        case 'undo':
        case 'redo':
          setTimeout(() => {
            onChange(change.patches as FormBuilderPatch[])
          })
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
    [focusPath, forwardedRef, onBlur, onChange, onFocus, toast]
  )

  const handleFocusSkipperClick = useCallback(() => {
    if (forwardedRef.current) {
      PortableTextEditor.focus(forwardedRef.current)
    }
  }, [forwardedRef])

  const handleIgnoreValidation = useCallback((): void => {
    setIgnoreValidationError(true)
  }, [])

  const respondToInvalidContent = useMemo(() => {
    if (invalidValue && invalidValue.resolution) {
      return (
        <Box marginBottom={2}>
          <RespondToInvalidContent
            onChange={handleEditorChange}
            onIgnore={handleIgnoreValidation}
            resolution={invalidValue.resolution}
          />
        </Box>
      )
    }
    return null
  }, [handleEditorChange, handleIgnoreValidation, invalidValue])

  // Scroll to *the field* (not the editor) into view if we have focus in the field.
  // For internal editor scrolling see useScrollToFocusFromOutside and useScrollSelectionIntoView in
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
        <PortableTextEditor
          ref={ref}
          incomingPatches$={patchObservable}
          onChange={handleEditorChange}
          maxBlocks={undefined} // TODO: from schema?
          readOnly={readOnly}
          type={type as FIXME}
          value={value}
        >
          <Compositor
            {...props}
            focusPath={focusPath}
            focused={focused}
            hasFocus={hasFocus}
            hotkeys={hotkeys}
            isFullscreen={isFullscreen}
            markers={markers}
            members={members}
            onChange={onChange}
            onCopy={onCopy}
            onInsert={onInsert}
            onPaste={onPaste}
            onSetCollapsed={onSetCollapsed}
            onToggleFullscreen={handleToggleFullscreen}
            patches$={patches$}
            renderBlockActions={renderBlockActions}
            renderCustomMarkers={renderCustomMarkers}
            renderItem={renderItem}
            value={value}
          />
        </PortableTextEditor>
      )}
    </Box>
  )
})

function shouldSetEditorFormBuilderFocus(
  editor: PortableTextEditor,
  selection: EditorSelection | undefined,
  focusPath: Path
) {
  return (
    selection && // If we have something selected
    focusPath.slice(-1)[0] !== FOCUS_TERMINATOR && // Not if in transition to open modal
    PortableTextEditor.isObjectPath(editor, focusPath) === false // Not if this is pointing to an embedded object
  )
}
