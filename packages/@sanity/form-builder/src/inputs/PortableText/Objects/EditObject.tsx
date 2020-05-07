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
  const [isChanged, setIsChanged] = useState(false)
  const [patchedObject, setPatchedObject] = useState(object)
  const editModalLayout: ModalType = get(type, 'options.editModal')
  const flush = debounce(() => {
    onChange(PatchEvent.from([set(patchedObject, [])]), formBuilderPath)
  }, 500)
  const handleClose = (): void => {
    if (isChanged) {
      flush()
    }
    onClose()
  }

  const handleChange = (patchEvent: PatchEvent): void => {
    setIsChanged(true)
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
          referenceElement={referenceElement}
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
          object={patchedObject}
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
