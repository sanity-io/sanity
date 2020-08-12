import FormField from 'part:@sanity/components/formfields/default'
import React, {useEffect, useState, useMemo} from 'react'
import {
  EditorChange,
  Patch as EditorPatch,
  PortableTextBlock,
  PortableTextEditor,
  Type
} from '@sanity/portable-text-editor'
import {Subject} from 'rxjs'
import {Patch} from '../../typedefs/patch'
import PatchEvent from '../../PatchEvent'
import {Presence, Marker} from '../../typedefs'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {Path} from '../../typedefs/path'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import Input from './Input'
import InvalidValue from './InvalidValue'

export type PatchWithOrigin = Patch & {
  origin: 'local' | 'remote' | 'internal'
  timestamp: Date
}

type Props = {
  focusPath: Path
  level: number
  markers: Array<Marker>
  onBlur: () => void
  onChange: (arg0: PatchEvent) => void
  onFocus: (Path) => void
  onPaste?: (arg0: {
    event: React.SyntheticEvent
    path: []
    type: Type
    value: PortableTextBlock[] | undefined
  }) => {
    insert?: PortableTextBlock[]
    path?: []
  }
  readOnly: boolean | null
  renderBlockActions?: RenderBlockActions
  renderCustomMarkers?: RenderCustomMarkers
  presence: Presence[]
  subscribe: (arg0: ({patches: PatchEvent}) => void) => void
  type: Type
  value: PortableTextBlock[] | undefined
}

export default withPatchSubscriber(function PortableTextInput(props: Props) {
  const {
    level,
    markers,
    onBlur,
    onChange,
    onFocus,
    onPaste,
    presence,
    readOnly,
    renderBlockActions,
    renderCustomMarkers,
    type,
    value
  } = props

  const [valueTouchedByMarkers, setValueTouchedByMarkers] = useState(value)
  const [hasFocus, setHasFocus] = useState(false)
  const [invalidValue, setInvalidValue] = useState(null)
  const [ignoreValidation, setIgnoreValidation] = useState(false)

  let incoming: PatchWithOrigin[] = [] // Incoming patches (not the user's own)
  let unsubscribe
  const patche$: Subject<EditorPatch> = new Subject()

  // The PTE editor (module) will not re-render unless the value is changed.
  // We want to re-render it when markers changes too (as we display error indicators within the content),
  // so create a fresh value when marker content changes.
  useEffect(() => {
    setValueTouchedByMarkers(value ? [...value] : value)
  }, [markers, value])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [value])

  // Subscribe to incoming patches
  useEffect(() => {
    unsubscribe = props.subscribe(handleDocumentPatches)
    return () => {
      unsubscribe()
    }
  }, [])

  function handleDocumentPatches({
    patches
  }: {
    patches: PatchWithOrigin[]
    snapshot: PortableTextBlock[] | undefined
  }): void {
    const patchSelection =
      patches && patches.length > 0 && patches.filter(patch => patch.origin !== 'local')
    if (patchSelection) {
      incoming = incoming.concat(patchSelection)
      patchSelection.map(patch => patche$.next(patch))
    }
  }

  // eslint-disable-next-line complexity
  function handleEditorChange(change: EditorChange): void {
    switch (change.type) {
      case 'mutation':
        onChange(PatchEvent.from(change.patches))
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
      case 'selection':
      case 'value':
      case 'ready':
      case 'patch':
      case 'unset':
      case 'loading':
        break
      default:
        throw new Error(`Unhandled editor change ${JSON.stringify(change)}`)
    }
  }

  function handleIgnoreValidation(): void {
    setIgnoreValidation(true)
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

  if (invalidValue && !ignoreValidation) {
    return (
      <>
        {formField}
        <InvalidValue
          onChange={handleEditorChange}
          onIgnore={handleIgnoreValidation}
          resolution={invalidValue.resolution}
          value={value}
        />
      </>
    )
  }
  const input = useMemo(
    () => (
      <PortableTextEditor
        incomingPatche$={patche$.asObservable()}
        onChange={handleEditorChange}
        maxBlocks={undefined} // TODO: from schema?
        readOnly={readOnly}
        type={type}
        value={valueTouchedByMarkers}
      >
        {formField}
        <Input
          focusPath={props.focusPath}
          hasFocus={hasFocus}
          markers={markers}
          onBlur={onBlur}
          onChange={onChange}
          onFocus={onFocus}
          onPaste={onPaste}
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
    [valueTouchedByMarkers, hasFocus, props.focusPath, readOnly]
  )
  return input
})
