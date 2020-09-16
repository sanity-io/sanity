/* eslint-disable react/prop-types */
import React, {FunctionComponent, useMemo} from 'react'

import Popover from 'part:@sanity/components/dialogs/popover'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {FormFieldPresence, PresenceOverlay} from '@sanity/base/presence'
import {FormBuilderInput} from '../../../../FormBuilderInput'
import {Marker, Type as FormBuilderType} from '../../../../typedefs'
import {Path} from '../../../../typedefs/path'
import {PatchEvent} from '../../../../PatchEvent'

interface Props {
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
  referenceElement: HTMLElement
  type: Type
}

export const PopoverObjectEditing: FunctionComponent<Props> = ({
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
  referenceElement,
  type
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
          size="small"
          padding="none"
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
              type={type as FormBuilderType}
              value={object}
            />
          </PresenceOverlay>
        </Popover>
      )}
    </Stacked>
  )
}
