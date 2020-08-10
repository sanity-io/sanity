/* eslint-disable react/prop-types */
import React, {FunctionComponent, useMemo} from 'react'

import Popover from 'part:@sanity/components/dialogs/popover'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {Overlay as PresenceOverlay} from '@sanity/components/presence'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {Marker, Presence} from '../../../../typedefs'
import {Path} from '../../../../typedefs/path'
import {PatchEvent} from '../../../../PatchEvent'

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
  const element = useMemo(() => referenceElement, [])
  return (
    <Stacked>
      {() => (
        <Popover
          placement="bottom"
          referenceElement={element}
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
