/* eslint-disable react/prop-types */
import React from 'react'
import {PortableTextBlock, Type, PortableTextChild} from '@sanity/portable-text-editor'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {Overlay as PresenceOverlay} from '@sanity/components/presence'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {Marker, Presence} from '../../../../typedefs'
import {Path} from '../../../../typedefs/path'
import {PatchEvent} from '../../../../PatchEvent'

type Props = {
  type: Type
  object: PortableTextBlock | PortableTextChild
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
  onClose: (event: React.SyntheticEvent) => void
  presence: Presence[]
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
          title={type.title}
          onClose={onClose}
          onClickOutside={onClose}
          showCloseButton
        >
          <DialogContent size="medium">
            <PresenceOverlay>
              <FormBuilderInput
                type={type}
                level={0}
                readOnly={readOnly || type.readOnly}
                value={object}
                onChange={handleChange}
                onFocus={onFocus}
                onBlur={onBlur}
                presence={presence}
                focusPath={focusPath}
                path={path}
                markers={markers}
              />
            </PresenceOverlay>
          </DialogContent>
        </DefaultDialog>
      )}
    </Stacked>
  )
}
