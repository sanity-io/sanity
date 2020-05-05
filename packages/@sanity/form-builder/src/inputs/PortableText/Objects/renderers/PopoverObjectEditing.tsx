/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'

import DialogContent from 'part:@sanity/components/dialogs/content'
import Popover from 'part:@sanity/components/dialogs/popover'
import Stacked from 'part:@sanity/components/utilities/stacked'

import {FormBuilderInput} from '../../../../FormBuilderInput'
import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {Marker} from '../../../../typedefs'
import {Path} from '../../../../typedefs/path'
import {PatchEvent} from '../../../../PatchEvent'

type Props = {
  type: Type
  object: PortableTextBlock | PortableTextChild
  referenceElement: React.RefObject<HTMLDivElement> | React.RefObject<HTMLSpanElement>
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onFocus: (arg0: Path) => void
  onClose: (event: React.SyntheticEvent) => void
  onBlur: () => void
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
  onBlur,
  onClose
}): JSX.Element => {
  const handleChange = (patchEvent: PatchEvent): void => onChange(patchEvent, path)
  return (
    <Stacked>
      {(): JSX.Element => (
        <Popover
          placement="bottom"
          referenceElement={referenceElement.current}
          onClickOutside={onClose}
          onEscape={onClose}
          onClose={onClose}
          title={type.title}
          padding="none"
        >
          <DialogContent size="medium" padding="small">
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
              markers={markers}
            />
          </DialogContent>
        </Popover>
      )}
    </Stacked>
  )
}
