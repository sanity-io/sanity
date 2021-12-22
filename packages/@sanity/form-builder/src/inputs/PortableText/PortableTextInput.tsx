import {FormField} from '@sanity/base/components'
import React, {useEffect, useState, useMemo, useCallback, useRef} from 'react'
import {Marker, Path} from '@sanity/types'
import {FormFieldPresence} from '@sanity/base/presence'
import {
  EditorChange,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  Type,
  HotkeyOptions,
  EditorSelection,
} from '@sanity/portable-text-editor'
import {Subject} from 'rxjs'
import {Box, Text, useToast} from '@sanity/ui'
import scrollIntoView from 'scroll-into-view-if-needed'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import PatchEvent from '../../PatchEvent'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {Patch} from '../../patch/types'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import {Compositor} from './Compositor'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import {VisibleOnFocusButton} from './VisibleOnFocusButton'

// An outer React PureComponent Class purely to satisfy the form-builder's need for 'blur' and 'focus' class methods.
export const PortableTextInput = (withPatchSubscriber(
  class PortableTextInput extends React.PureComponent<
    PortableTextInputProps & {children: React.ReactNode}
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
      const {type, level, markers, presence} = this.props
      return (
        <FormField
          __unstable_changeIndicator={false}
          __unstable_markers={markers}
          __unstable_presence={presence}
          description={type.description}
          level={level}
          title={type.title}
        >
          <PortableTextInputController {...this.props} ref={this.editorRef} />
        </FormField>
      )
    }
  }
) as React.ComponentType) as React.ComponentType<PortableTextInputProps>

export type PatchWithOrigin = Patch & {
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

export type PortableTextInputProps = {
  focusPath: Path
  hotkeys?: HotkeyOptions
  level: number
  markers: Marker[]
  onBlur: () => void
  onChange: (event: PatchEvent) => void
  onFocus: (path) => void
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  readOnly: boolean | null
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  presence: FormFieldPresence[]
  subscribe: PatchSubscribe
  type: Type
  value: PortableTextBlock[] | undefined
}

const PortableTextInputController = React.forwardRef(function PortableTextInputController(
  props: Omit<PortableTextInputProps, 'level'>,
  ref: React.RefObject<PortableTextEditor>
) {
  const {
    focusPath,
    hotkeys,
    markers,
    onBlur,
    onChange,
    onCopy,
    onFocus,
    onPaste,
    presence,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    type,
    value,
    subscribe,
  } = props

  const [hasFocus, setHasFocus] = useState(false)
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toast = useToast()

  // Memoized patch stream
  const patches$: Subject<EditorPatch> = useMemo(() => new Subject(), [])
  const patchObservable = useMemo(() => patches$.asObservable(), [patches$])

  const innerElementRef = useRef(null)

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
    PortableTextEditor.focus(ref.current)
  }, [isFullscreen, ref])

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
            onChange(PatchEvent.from(change.patches))
          })
          break
        case 'selection':
          if (shouldSetEditorFormBuilderFocus(ref.current, change.selection, focusPath)) {
            onFocus(change.selection.focus.path)
          }
          break
        case 'focus':
          setHasFocus(true)
          onFocus(PortableTextEditor.getSelection(ref.current)?.focus.path || [])
          break
        case 'blur':
          setHasFocus(false)
          onBlur()
          break
        case 'undo':
        case 'redo':
          setTimeout(() => {
            onChange(PatchEvent.from(change.patches))
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
    [focusPath, onBlur, onChange, onFocus, ref, toast]
  )

  const handleFocusSkipperClick = useCallback(() => {
    if (ref.current) {
      PortableTextEditor.focus(ref.current)
    }
  }, [ref])

  const handleIgnoreValidation = useCallback((): void => {
    setIgnoreValidationError(true)
  }, [])

  const respondToInvalidContent = useMemo(() => {
    if (invalidValue) {
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

  // Scroll to the field if we have focus and needed
  useEffect(() => {
    if (focusPath && focusPath.length > 0 && innerElementRef.current) {
      scrollIntoView(innerElementRef.current, {
        scrollMode: 'if-needed',
      })
    }
  }, [focusPath, value])

  return (
    <div ref={innerElementRef}>
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
          type={type}
          value={value}
        >
          <Compositor
            focusPath={focusPath}
            hasFocus={hasFocus}
            hotkeys={hotkeys}
            isFullscreen={isFullscreen}
            markers={markers}
            onChange={onChange}
            onCopy={onCopy}
            onFocus={onFocus}
            onPaste={onPaste}
            onToggleFullscreen={handleToggleFullscreen}
            patches$={patches$}
            presence={presence}
            readOnly={readOnly}
            renderBlockActions={renderBlockActions}
            renderCustomMarkers={renderCustomMarkers}
            value={value}
          />
        </PortableTextEditor>
      )}
    </div>
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
