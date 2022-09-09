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
  compareValue: PortableTextBlock[] | undefined
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
    compareValue,
    subscribe,
  } = props

  const [hasFocus, setHasFocus] = useState(false)
  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  const [invalidValue, setInvalidValue] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isActive, setIsActive] = useState(false)

  // Set as active whenever we have focus inside the editor.
  useEffect(() => {
    if (hasFocus || focusPath.length > 1) {
      setIsActive(true)
    }
  }, [hasFocus, focusPath])

  const toast = useToast()

  // Memoized patch stream
  const patchSubject: Subject<{
    patches: EditorPatch[]
    snapshot: PortableTextBlock[] | undefined
  }> = useMemo(() => new Subject(), [])
  const remotePatch$ = useMemo(() => patchSubject.asObservable(), [patchSubject])

  const innerElementRef = useRef<HTMLDivElement | null>(null)

  const handleToggleFullscreen = useCallback(() => {
    if (ref.current) {
      const prevSel = PortableTextEditor.getSelection(ref.current)
      setIsFullscreen((v) => !v)
      setTimeout(() => {
        if (ref.current) {
          PortableTextEditor.focus(ref.current)
          if (prevSel) {
            PortableTextEditor.select(ref.current, {...prevSel})
          }
        }
      })
    }
  }, [ref])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Subscribe to incoming patches
  useEffect(() => {
    const unsubscribe = subscribe(({patches, snapshot}): void => {
      if (patches.length > 0) {
        patchSubject.next({patches, snapshot})
      }
    })
    return () => unsubscribe()
  }, [patchSubject, subscribe])

  const handleActivate = useCallback((): void => {
    if (!isActive) {
      setIsActive(true)
      // Focus the editor in the next tick if needed
      // Next tick because we are in a re-rendering phase of the editor at this point (activating it).
      if (!hasFocus) {
        setTimeout(() => {
          if (ref.current) {
            PortableTextEditor.focus(ref.current)
          }
        })
      }
      if (isActive) {
        setHasFocus(true)
      }
    }
  }, [hasFocus, isActive, ref])

  // Handle editor changes
  const handleEditorChange = useCallback(
    (change: EditorChange): void => {
      switch (change.type) {
        case 'mutation':
          onChange(PatchEvent.from(change.patches as Patch[]))
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
          onChange(PatchEvent.from(change.patches as Patch[]))
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
          incomingPatches$={remotePatch$}
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
            isActive={isActive}
            isFullscreen={isFullscreen}
            markers={markers}
            onActivate={handleActivate}
            onChange={onChange}
            onCopy={onCopy}
            onFocus={onFocus}
            onPaste={onPaste}
            onToggleFullscreen={handleToggleFullscreen}
            presence={presence}
            readOnly={readOnly}
            renderBlockActions={renderBlockActions}
            renderCustomMarkers={renderCustomMarkers}
            value={value}
            compareValue={compareValue}
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
