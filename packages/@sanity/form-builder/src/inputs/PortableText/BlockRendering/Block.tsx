import React from 'react'
import {get} from 'lodash'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'

import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'
import {ModalType} from '../../ArrayInput/typedefs'
import DefaultBlockEditing from './DefaultBlockEditing'
import FullscreenBlockEditing from './FullscreenBlockEditing'
import PopoverBlockEditing from './PopoverBlockEditing'
import BlockPreview from './BlockPreview'

type BlockProps = {
  type: Type
  block: PortableTextBlock
  referenceElement: React.RefObject<HTMLDivElement>
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  handleChange: (patchEvent: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
}

const Block = (props: BlockProps): JSX.Element => {
  const {
    type,
    block,
    referenceElement,
    readOnly,
    markers,
    focusPath,
    handleChange,
    onFocus,
    onBlur
  } = props
  const editModalLayout: ModalType = get(type.options, 'editModal')
  const [isEditingNode, setEditingNode] = React.useState(false)

  const path = [{_key: block._key}]

  const handleOpen = (): void => {
    setEditingNode(true)
  }

  const handleClose = (): void => {
    setEditingNode(false)
  }

  const renderBlockEditing = (): JSX.Element => {
    switch (editModalLayout) {
      case 'fullscreen': {
        return (
          <FullscreenBlockEditing
            type={type}
            block={block}
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
            type={type}
            block={block}
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
            type={type}
            block={block}
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

  return (
    <div>
      {isEditingNode && renderBlockEditing()}
      <BlockPreview
        type={type}
        block={block}
        path={path}
        readOnly={readOnly}
        onFocus={onFocus}
        onClickingDelete={handleChange}
        onClickingEdit={handleOpen}
      />
    </div>
  )
}

export default Block
