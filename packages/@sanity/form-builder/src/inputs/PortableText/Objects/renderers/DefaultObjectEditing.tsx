/* eslint-disable react/prop-types */
import React from 'react'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {PortableTextBlock, Type, PortableTextChild} from '@sanity/portable-text-editor'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {Marker, Type as FormBuilderType} from '../../../../typedefs'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {Path} from '../../../../typedefs/path'
import {PatchEvent} from '../../../../PatchEvent'

type Props = {
  focusPath: Path
  markers: Marker[]
  object: PortableTextBlock | PortableTextChild
  onBlur: () => void
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onClose: (event: React.SyntheticEvent) => void
  onFocus: (arg0: Path) => void
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
    type
  } = props
  const handleChange = (patchEvent: PatchEvent): void => onChange(patchEvent, path)
  return (
    <Stacked>
      {(): JSX.Element => (
        <DefaultDialog
          isOpen
          onClickOutside={onClose}
          onClose={onClose}
          showCloseButton
          title={type.title}
          size="medium"
        >
          <PresenceOverlay>
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
              type={type as FormBuilderType}
              value={object}
            />
          </PresenceOverlay>
        </DefaultDialog>
      )}
    </Stacked>
  )
}
