/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'

import Popover from 'part:@sanity/components/dialogs/popover'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {FormBuilderInput} from '../../../../FormBuilderInput'
import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {Marker, Presence} from '../../../../typedefs'
import {Path} from '../../../../typedefs/path'
import {PatchEvent} from '../../../../PatchEvent'
import {Overlay as PresenceOverlay} from '@sanity/components/presence'

interface Props {
  type: Type
  object: PortableTextBlock | PortableTextChild
  referenceElement: HTMLElement
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onFocus: (arg0: Path) => void
  onClose: (event: React.SyntheticEvent) => void
  onBlur: () => void
  presence: Presence[]
}

export const PopoverObjectEditing: FunctionComponent<Props> = ({
  type,
  object,
  referenceElement,
  readOnly,
  markers,
  focusPath,
  path,
  onChange,
  onFocus,
  presence,
  onBlur,
  onClose
}) => {
  const handleChange = (patchEvent: PatchEvent): void => onChange(patchEvent, path)
  return (
    <Stacked>
      {() => (
        <Popover
          placement="bottom"
          referenceElement={referenceElement}
          onClickOutside={onClose}
          onEscape={onClose}
          onClose={onClose}
          title={type.title}
        >
          <PresenceOverlay>
            <FormBuilderInput
              type={type}
              level={0}
              readOnly={readOnly || type.readOnly}
              value={object}
              onChange={handleChange}
              onFocus={onFocus}
              onBlur={onBlur}
              focusPath={focusPath}
              path={path}
              presence={presence}
              markers={markers}
            />
          </PresenceOverlay>
        </Popover>
      )}
    </Stacked>
  )
}
