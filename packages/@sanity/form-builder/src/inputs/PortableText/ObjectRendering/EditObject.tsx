import React, {FunctionComponent} from 'react'
import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {get} from 'lodash'

import {DefaultObjectEditing} from './DefaultObjectEditing'
import {FullscreenObjectEditing} from './FullscreenObjectEditing'
import {PopoverObjectEditing} from './PopoverObjectEditing'

import {ModalType} from '../../ArrayInput/typedefs'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'

type Props = {
  value: PortableTextBlock | PortableTextChild
  type: Type
  referenceElement: React.RefObject<HTMLSpanElement> | React.RefObject<HTMLDivElement>
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  handleChange: (patchEvent: PatchEvent) => void
  handleClose: (event: React.SyntheticEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
}

export const EditObject: FunctionComponent<Props> = ({
  value,
  type,
  referenceElement,
  readOnly,
  markers,
  focusPath,
  path,
  handleChange,
  handleClose,
  onFocus,
  onBlur
}): JSX.Element => {
  const editModalLayout: ModalType = get(type.options, 'editModal')

  switch (editModalLayout) {
    case 'fullscreen': {
      return (
        <FullscreenObjectEditing
          block={value}
          type={type}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={path}
          handleChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClose={handleClose}
        />
      )
    }
    case 'popover': {
      return (
        <PopoverObjectEditing
          block={value}
          type={type}
          referenceElement={referenceElement}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={path}
          handleChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClose={handleClose}
        />
      )
    }
    default: {
      return (
        <DefaultObjectEditing
          block={value}
          type={type}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={path}
          handleChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClose={handleClose}
        />
      )
    }
  }
}
