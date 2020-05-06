import React, {FunctionComponent, useState} from 'react'
import {PortableTextBlock, PortableTextChild, Type} from '@sanity/portable-text-editor'
import {get, debounce} from 'lodash'

import {DefaultObjectEditing} from './renderers/DefaultObjectEditing'
import {FullscreenObjectEditing} from './renderers/FullscreenObjectEditing'
import {PopoverObjectEditing} from './renderers/PopoverObjectEditing'

import {ModalType} from '../../ArrayInput/typedefs'
import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent, set} from '../../../PatchEvent'
import {applyAll} from '../../../patch/applyPatch'

type Props = {
  object: PortableTextBlock | PortableTextChild
  type: Type
  referenceElement: React.RefObject<HTMLSpanElement> | React.RefObject<HTMLDivElement>
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  path: Path
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onClose: (event: React.SyntheticEvent) => void
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
  path,
  onChange,
  onFocus,
  onBlur
}): JSX.Element => {
  const [patchedObject, setPatchedObject] = useState(object)
  const editModalLayout: ModalType = get(type.options, 'editModal')
  const flush = debounce(() => {
    onChange(PatchEvent.from([set(patchedObject, [])]), path)
  }, 500)
  const handleClose = (): void => {
    flush()
    onFocus(path)
  }

  const handleChange = (patchEvent: PatchEvent): void => {
    setPatchedObject(applyAll(patchedObject, patchEvent.patches))
    flush()
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
          path={path}
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
          referenceElement={referenceElement}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={path}
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
          object={patchedObject}
          type={type}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          path={path}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onClose={handleClose}
        />
      )
    }
  }
}
