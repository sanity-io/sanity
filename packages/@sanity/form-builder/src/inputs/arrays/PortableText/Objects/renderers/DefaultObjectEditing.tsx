/* eslint-disable react/prop-types */
import React from 'react'
import {Path, Marker, SchemaType} from '@sanity/types'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {PortableTextBlock, Type, PortableTextChild} from '@sanity/portable-text-editor'
import {FormBuilderInput} from '../../../../../FormBuilderInput'
import {PatchEvent} from '../../../../../PatchEvent'
import {DefaultDialog} from '../../../../../legacyParts'

type Props = {
  focusPath: Path
  markers: Marker[]
  object: PortableTextBlock | PortableTextChild
  onBlur: () => void
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onClose: (event: React.SyntheticEvent) => void
  onFocus: (path: Path) => void
  path: Path
  presence: FormFieldPresence[]
  readOnly: boolean
  type: Type
}

export function DefaultObjectEditing(props: Props) {
  const {
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
  } = props
  const handleChange = (patchEvent: PatchEvent): void => onChange(patchEvent, path)
  return (
    <DefaultDialog
      isOpen
      // onClickOutside={onClose}
      onClose={onClose}
      onEscape={onClose}
      showCloseButton
      title={type.title}
      size="medium"
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
    </DefaultDialog>
  )
}
