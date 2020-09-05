import FormField from 'part:@sanity/components/formfields/default'
import Snackbar from 'part:@sanity/components/snackbar/default'
import React, {useEffect, useState, useMemo} from 'react'
import {FormFieldPresence} from '@sanity/base/presence'
import {
  EditorChange,
  ErrorChange,
  OnCopyFn,
  OnPasteFn,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  Type,
  HotkeyOptions
} from '@sanity/portable-text-editor'
import {Subject} from 'rxjs'
import {Patch} from '../../typedefs/patch'
import PatchEvent from '../../PatchEvent'
import {Marker} from '../../typedefs'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {Path} from '../../typedefs/path'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import Input from './Input'
import RespondToInvalidContent from './InvalidValue'
import styles from './PortableTextInput.css'

export type PatchWithOrigin = Patch & {
  origin: 'local' | 'remote' | 'internal'
  timestamp: Date
}

type Props = {
  focusPath: Path
  hotkeys: HotkeyOptions
  level: number
  markers: Array<Marker>
  onBlur: () => void
  onChange: (arg0: PatchEvent) => void
  onFocus: (Path) => void
  onCopy?: OnCopyFn
  onPaste?: OnPasteFn
  readOnly: boolean | null
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  presence: FormFieldPresence[]
  subscribe: (arg0: ({patches: PatchEvent}) => void) => void
  type: Type
  value: PortableTextBlock[] | undefined
}

const PortableTextInputWithRef = React.forwardRef(function PortableTextInput(
  props: Props,
  ref: React.RefObject<PortableTextEditor>
) {
  const {
    focusPath,
    hotkeys,
    level,
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
    value
  } = props

  // The PortableTextEditor will not re-render unless the value is changed (which is good).
  // But, we want to re-render it when the markers changes too,
  // (we render error indicators directly in the editor nodes)
  const validationHash = markers
    .map(marker =>
      JSON.stringify(marker.path)
        .concat(marker.type)
        .concat(marker.level)
    )
    .sort()
    .join('')
  const [valueTouchedByMarkers, setValueTouchedByMarkers] = useState(value)
  useEffect(() => {
    setValueTouchedByMarkers(value ? [...value] : value)
  }, [validationHash, value])

  const [editorErrorNotification, setEditorErrorNotification]: [ErrorChange, any] = useState(
    undefined
  )

  // Reset invalidValue if new value is coming in from props
  const [invalidValue, setInvalidValue] = useState(null)
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [value])

  // Subscribe to incoming patches
  let unsubscribe
  useEffect(() => {
    unsubscribe = props.subscribe(handleDocumentPatches)
    return () => {
      unsubscribe()
    }
  }, [])

  // Memoized patch stream
  const patche$: Subject<EditorPatch> = useMemo(() => new Subject(), [])

  // Handle incoming patches from withPatchSubscriber HOC
  function handleDocumentPatches({
    patches
  }: {
    patches: PatchWithOrigin[]
    snapshot: PortableTextBlock[] | undefined
  }): void {
    const patchSelection =
      patches && patches.length > 0 && patches.filter(patch => patch.origin !== 'local')
    if (patchSelection) {
      patchSelection.map(patch => patche$.next(patch))
    }
  }

  // Handle editor changes
  // eslint-disable-next-line complexity
  const [hasFocus, setHasFocus] = useState(false)
  function handleEditorChange(change: EditorChange): void {
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
        setEditorErrorNotification(change)
        break
      // case 'selection':
      // case 'value':
      // case 'ready':
      // case 'patch':
      // case 'unset':
      // case 'loading':
      //   break
      // default:
      //   throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
      default:
    }
  }

  const [ignoreValidationError, setIgnoreValidationError] = useState(false)
  function handleIgnoreValidation(): void {
    setIgnoreValidationError(true)
  }

  const handleFocusSkipper = () => {
    if (ref.current) {
      PortableTextEditor.focus(ref.current)
    }
  }

  const formField = useMemo(
    () => (
      <FormField
        description={type.description}
        label={type.title}
        level={level}
        markers={markers}
        presence={presence}
      />
    ),
    [markers, presence]
  )

  // Render error message and resolution
  let respondToInvalidContent = null
  if (invalidValue) {
    respondToInvalidContent = (
      <>
        {formField}
        <RespondToInvalidContent
          onChange={handleEditorChange}
          onIgnore={handleIgnoreValidation}
          resolution={invalidValue.resolution}
          value={value}
        />
      </>
    )
  }

  const [isFullscreen, setIsFullscreen] = useState(false)
  const handleToggleFullscreen = () => setIsFullscreen(!isFullscreen)
  const editorInput = useMemo(
    () => (
      <PortableTextEditor
        ref={ref}
        incomingPatche$={patche$.asObservable()}
        onChange={handleEditorChange}
        maxBlocks={undefined} // TODO: from schema?
        readOnly={readOnly}
        type={type}
        value={valueTouchedByMarkers}
      >
        {formField}
        {!readOnly && (
          <button
            type="button"
            tabIndex={0}
            className={styles.focusSkipper}
            onClick={handleFocusSkipper}
          >
            Jump to editor
          </button>
        )}
        <Input
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
          patche$={patche$}
          presence={presence}
          readOnly={readOnly}
          renderBlockActions={renderBlockActions}
          renderCustomMarkers={renderCustomMarkers}
          type={props.type}
          value={valueTouchedByMarkers}
        />
      </PortableTextEditor>
    ),
    [focusPath, hasFocus, isFullscreen, presence, readOnly, valueTouchedByMarkers]
  )
  return (
    <>
      {editorErrorNotification && (
        // Display intended editor errors to the user
        <Snackbar
          kind={editorErrorNotification.level}
          isPersisted
          onAction={() => setEditorErrorNotification(undefined)}
          subtitle={<div>{editorErrorNotification.description}</div>}
        />
      )}
      {invalidValue && !ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && editorInput}
    </>
  )
})

export default withPatchSubscriber(
  class PortableTextInputWithFocusAndBlur extends React.Component<
    Props & {children: React.ReactNode}
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
      return <PortableTextInputWithRef {...this.props} ref={this.editorRef} />
    }
  }
)
