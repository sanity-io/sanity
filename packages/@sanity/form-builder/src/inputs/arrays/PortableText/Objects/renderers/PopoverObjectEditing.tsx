/* eslint-disable react/prop-types */
import React, {FunctionComponent, useEffect, useState} from 'react'

import {
  PortableTextBlock,
  PortableTextChild,
  PortableTextEditor,
  Type,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {Path, Marker, SchemaType} from '@sanity/types'
import {FormBuilderInput} from '../../../../../FormBuilderInput'
import {PatchEvent} from '../../../../../PatchEvent'
import {PopoverDialog} from '../../../../../transitional/PopoverDialog'

interface Props {
  editorPath: Path
  focusPath: Path
  markers: Marker[]
  object: PortableTextBlock | PortableTextChild
  onBlur: () => void
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onClose: () => void
  onFocus: (path: Path) => void
  path: Path
  presence: FormFieldPresence[]
  readOnly: boolean
  type: Type
}

export const PopoverObjectEditing: FunctionComponent<Props> = ({
  editorPath,
  focusPath,
  markers,
  object,
  onBlur,
  onChange,
  onClose,
  onFocus,
  path,
  presence,
  readOnly,
  type,
}) => {
  const editor = usePortableTextEditor()
  const handleChange = (patchEvent: PatchEvent): void => onChange(patchEvent, path)
  const getEditorElement = () => {
    const [editorObject] = PortableTextEditor.findByPath(editor, editorPath)
    return PortableTextEditor.findDOMNode(editor, editorObject) as HTMLElement
  }
  const [refElement, setRefElement] = useState(getEditorElement())

  useEffect(() => {
    setRefElement(getEditorElement())
  }, [object])

  return (
    <PopoverDialog
      fallbackPlacements={['top', 'bottom']}
      placement="bottom"
      referenceElement={refElement}
      onClose={onClose}
      preventOverflow
      portal
      title={type.title}
      size="small"
    >
      <PresenceOverlay margins={[0, 0, 1, 0]}>
        <FormBuilderInput
          focusPath={focusPath}
          level={0}
          markers={markers}
          onBlur={onBlur}
          onChange={handleChange}
          onFocus={onFocus}
          path={path}
          presence={presence}
          readOnly={readOnly || type.readOnly}
          type={type as SchemaType}
          value={object}
        />
      </PresenceOverlay>
    </PopoverDialog>
  )
}
