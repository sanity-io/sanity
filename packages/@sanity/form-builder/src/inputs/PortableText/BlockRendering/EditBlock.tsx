import React, {FunctionComponent} from 'react'
import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {get} from 'lodash'

import {DefaultBlockEditing} from './DefaultBlockEditing'
import {FullscreenBlockEditing} from './FullscreenBlockEditing'
import {PopoverBlockEditing} from './PopoverBlockEditing'

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

export const EditBlock: FunctionComponent<Props> = ({
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
        <FullscreenBlockEditing
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
        <PopoverBlockEditing
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
        <DefaultBlockEditing
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
