import {uniqueId} from 'lodash'
import {FormField} from '@sanity/base/components'
import React, {useEffect, useState, useMemo, useCallback} from 'react'
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
} from '@sanity/portable-text-editor'
import {Subject} from 'rxjs'
import {Box, Text, usePortal, useToast} from '@sanity/ui'
import PatchEvent from '../../PatchEvent'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {Patch} from '../../patch/types'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import Input from './Input'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import VisibleOnFocusButton from './VisibleOnFocusButton'

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

const PortableTextInputWithRef = React.forwardRef(function PortableTextInput(
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
  const portal = usePortal()

  const editorId = useMemo(() => uniqueId('PortableTextInputRoot'), [])
  // Memoized patch stream
  const patches$: Subject<EditorPatch> = useMemo(() => new Subject(), [])
  const patchObservable = useMemo(() => patches$.asObservable(), [patches$])

  const handleToggleFullscreen = useCallback(() => setIsFullscreen(!isFullscreen), [isFullscreen])

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
          // Don't wait for the result
          setTimeout(() => {
            onChange(PatchEvent.from(change.patches))
          })
          break
        case 'focus':
          setHasFocus(true)
          break
        case 'blur':
          setHasFocus(false)
          break
        case 'undo':
        case 'redo':
          onChange(PatchEvent.from(change.patches))
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
    [onChange, toast]
  )

  const focusSkipperButton = useMemo(() => {
    const handleFocusSkipperClicked = () => {
      if (ref.current) {
        PortableTextEditor.focus(ref.current)
      }
    }
    return (
      // eslint-disable-next-line react/jsx-no-bind
      <VisibleOnFocusButton onClick={handleFocusSkipperClicked} style={{position: 'absolute'}}>
        <Text>Jump to editor</Text>
      </VisibleOnFocusButton>
    )
  }, [ref])

  const editorInput = useMemo(
    () => (
      <PortableTextEditor
        ref={ref}
        incomingPatches$={patchObservable}
        key={`portable-text-editor-${editorId}`}
        onChange={handleEditorChange}
        maxBlocks={undefined} // TODO: from schema?
        readOnly={readOnly}
        type={type}
        value={value}
      >
        {!readOnly && focusSkipperButton}
        <Input
          editorId={editorId}
          focusPath={focusPath}
          hasFocus={hasFocus}
          hotkeys={hotkeys}
          isFullscreen={isFullscreen}
          markers={markers}
          onBlur={onBlur}
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
          rootPortalElement={portal.element}
          value={value}
        />
      </PortableTextEditor>
    ),
    [
      editorId,
      focusPath,
      focusSkipperButton,
      handleEditorChange,
      handleToggleFullscreen,
      hasFocus,
      hotkeys,
      isFullscreen,
      markers,
      onBlur,
      onChange,
      onCopy,
      onFocus,
      onPaste,
      patches$,
      patchObservable,
      presence,
      readOnly,
      ref,
      renderBlockActions,
      renderCustomMarkers,
      type,
      value,
    ]
  )

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

  return (
    <>
      {!ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && editorInput}
    </>
  )
})

// An outer React Component with blur and focus class methods for the form-builder to call
export default (withPatchSubscriber(
  class PortableTextInputWithFocusAndBlur extends React.Component<
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
          <PortableTextInputWithRef
            {...this.props}
            // NOTE: this should be a temporary fix
            key={this.props.readOnly ? '$readOnly' : '$editable'}
            ref={this.editorRef}
          />
        </FormField>
      )
    }
  }
) as React.ComponentType) as React.ComponentType<PortableTextInputProps>
