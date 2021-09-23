// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {uniqueId} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import Snackbar from 'part:@sanity/components/snackbar/default'
import React, {useEffect, useState, useMemo, useCallback} from 'react'
import {Marker, Path} from '@sanity/types'
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
  HotkeyOptions,
} from '@sanity/portable-text-editor'
import {Subject} from 'rxjs'
import {Box, useToast} from '@sanity/ui'
import PatchEvent from '../../PatchEvent'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {Patch} from '../../patch/types'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import Input from './Input'
import {InvalidValue as RespondToInvalidContent} from './InvalidValue'
import styles from './PortableTextInput.module.css'

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

type Props = {
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
  props: Omit<Props, 'level'>,
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

  const [editorErrorNotification, setEditorErrorNotification]: [ErrorChange, any] = useState(
    undefined
  )
  const toast = useToast()

  // Reset invalidValue if new value is coming in from props
  const [invalidValue, setInvalidValue] = useState(null)
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [invalidValue, value])

  // Memoized patch stream
  const patches$: Subject<EditorPatch> = useMemo(() => new Subject(), [])
  const patchObservable = useMemo(() => patches$.asObservable(), [patches$])

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
  const [hasFocus, setHasFocus] = useState(false)
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

  const [ignoreValidationError, setIgnoreValidationError] = useState(false)

  const handleIgnoreValidation = useCallback((): void => {
    setIgnoreValidationError(true)
  }, [])

  const handleFocusSkipper = useCallback(() => {
    if (ref.current) {
      PortableTextEditor.focus(ref.current)
    }
  }, [ref])

  // Render error message and resolution
  let respondToInvalidContent = null
  if (invalidValue) {
    respondToInvalidContent = (
      <Box marginBottom={2}>
        <RespondToInvalidContent
          onChange={handleEditorChange}
          onIgnore={handleIgnoreValidation}
          resolution={invalidValue.resolution}
        />
      </Box>
    )
  }

  const [isFullscreen, setIsFullscreen] = useState(false)
  const handleToggleFullscreen = useCallback(() => setIsFullscreen(!isFullscreen), [isFullscreen])
  const editorId = useMemo(() => uniqueId('PortableTextInputRoot'), [])
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
          patches$={patches$}
          presence={presence}
          readOnly={readOnly}
          renderBlockActions={renderBlockActions}
          renderCustomMarkers={renderCustomMarkers}
          type={props.type}
          value={value}
        />
      </PortableTextEditor>
    ),
    [
      editorId,
      focusPath,
      handleEditorChange,
      handleFocusSkipper,
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
      presence,
      props.type,
      readOnly,
      ref,
      renderBlockActions,
      renderCustomMarkers,
      type,
      value,
    ]
  )

  const clearErrorNotification = useCallback(() => setEditorErrorNotification(undefined), [])

  return (
    <>
      {editorErrorNotification && (
        // Display intended editor errors to the user
        <Snackbar
          kind={editorErrorNotification.level}
          isPersisted
          onAction={clearErrorNotification}
          subtitle={<div>{editorErrorNotification.description}</div>}
        />
      )}
      {invalidValue && !ignoreValidationError && respondToInvalidContent}
      {(!invalidValue || ignoreValidationError) && editorInput}
    </>
  )
})

export default (withPatchSubscriber(
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
      const {type, level, markers, presence} = this.props
      return (
        <FormField
          description={type.description}
          label={type.title}
          level={level}
          markers={markers}
          presence={presence}
          changeIndicator={false}
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
) as React.ComponentType) as React.ComponentType<Props>
