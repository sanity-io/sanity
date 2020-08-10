import React, {useEffect, useState} from 'react'
import {
  EditorChange,
  PortableTextBlock,
  PortableTextEditor,
  Type
} from '@sanity/portable-text-editor'
import PatchEvent from '../../PatchEvent'
import {Presence, Marker} from '../../typedefs'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import {Path} from '../../typedefs/path'
import {RenderBlockActions, RenderCustomMarkers} from './types'
import Input from './Input'
import InvalidValue from './InvalidValue'

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
  const {readOnly, type, markers, value, onChange} = props
  const validation = markers.filter(marker => marker.type === 'validation')
  const validationHash = validation
    .map(marker => JSON.stringify(marker.path))
    .sort()
    .join('')

  const [valueTouchedByMarkers, setValueTouchedByMarkers] = useState(value)
  const [hasFocus, setHasFocus] = useState(false)
  const [selection, setSelection] = useState(null)
  const [invalidValue, setInvalidValue] = useState(null)
  const [ignoreValidation, setIgnoreValidation] = useState(false)

  // The PTE editor will not re-render unless the value is changed.
  // We want to re-render it when markers changes too (as we display error indicators within the content),
  // so create a fresh value when marker paths changes.
  useEffect(() => {
    setValueTouchedByMarkers(value ? [...value] : value)
  }, [validationHash, value])

  // Reset invalidValue if new value is coming in from props
  useEffect(() => {
    if (invalidValue && value !== invalidValue.value) {
      setInvalidValue(null)
    }
  }, [value])

  // eslint-disable-next-line complexity
  function handleEditorChange(change: EditorChange): void {
    switch (change.type) {
      case 'mutation':
        // Don't wait for the form-builder to save the document. We are in a local async state when changing the document anyway.
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
      case 'selection':
        if (change.selection) {
          setSelection(change.selection)
        }
        break
      case 'ready':
      case 'patch':
      case 'value':
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

  if (invalidValue && !ignoreValidation) {
    return (
      <InvalidValue
        onChange={handleEditorChange}
        onIgnore={handleIgnoreValidation}
        resolution={invalidValue.resolution}
        value={value}
      />
    )
  }
  return (
    <PortableTextEditor
      onChange={handleEditorChange}
      maxBlocks={undefined} // TODO: from schema?
      readOnly={readOnly}
      type={type}
      value={valueTouchedByMarkers}
    >
      <Input
        focusPath={props.focusPath}
        level={props.level}
        markers={props.markers}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onFocus={props.onFocus}
        onPaste={props.onPaste}
        readOnly={props.readOnly}
        renderBlockActions={props.renderBlockActions}
        renderCustomMarkers={props.renderCustomMarkers}
        presence={props.presence}
        subscribe={props.subscribe}
        type={props.type}
        value={valueTouchedByMarkers}
        handleEditorChange={handleEditorChange}
        hasFocus={hasFocus}
        invalidValue={invalidValue}
        selection={selection}
      />
    </PortableTextEditor>
  )
})
