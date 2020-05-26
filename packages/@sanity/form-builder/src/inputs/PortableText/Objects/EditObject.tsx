import React, {FunctionComponent, useMemo} from 'react'
import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {get} from 'lodash'

import {DefaultObjectEditing} from './renderers/DefaultObjectEditing'
import {FullscreenObjectEditing} from './renderers/FullscreenObjectEditing'
import {PopoverObjectEditing} from './renderers/PopoverObjectEditing'

import {ModalType} from '../../ArrayInput/typedefs'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'

type Props = {
  object: PortableTextBlock | PortableTextChild
  type: Type
  referenceElement: HTMLElement
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  formBuilderPath: Path
  editorPath: Path
  onChange: (patchEvent: PatchEvent, editPath: Path) => void
  onClose: () => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
}

export const EditObject: FunctionComponent<Props> = ({
  object,
  type,
  referenceElement,
  readOnly,
  markers,
  focusPath,
  formBuilderPath,
  onChange,
  onFocus,
  onClose,
  onBlur
}): JSX.Element => {
  const editModalLayout: ModalType = get(type, 'options.editModal')
  const handleClose = (): void => {
    onClose()
  }
  const refElm = useMemo(() => referenceElement, [])
  const handleChange = (patchEvent: PatchEvent): void => {
    onChange(patchEvent, formBuilderPath)
  }
  switch (editModalLayout) {
    case 'fullscreen': {
      return (
        <FullscreenObjectEditing
          object={object}
          type={type}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={formBuilderPath}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClose={handleClose}
        />
      )
    }
    case 'popover': {
      return (
        <PopoverObjectEditing
          object={object}
          type={type}
          referenceElement={refElm}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={formBuilderPath}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClose={handleClose}
        />
      )
    }
    default: {
      return (
        <DefaultObjectEditing
          object={object}
          type={type}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={formBuilderPath}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClose={handleClose}
        />
      )
    }
  }
}
