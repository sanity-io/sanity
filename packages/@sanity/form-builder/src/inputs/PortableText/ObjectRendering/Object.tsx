/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'

import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'

import {ObjectPreview} from './ObjectPreview'
import {EditObject} from './EditObject'

type Props = {
  type: Type
  value: PortableTextBlock
  referenceElement: React.RefObject<HTMLDivElement>
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  handleChange: (patchEvent: PatchEvent) => void
  onFocus: (arg0: Path) => void
  onBlur: () => void
}

export const Object: FunctionComponent<Props> = ({
  type,
  value,
  referenceElement,
  readOnly,
  markers,
  focusPath,
  handleChange,
  onFocus,
  onBlur
}): JSX.Element => {
  const [isEditingNode, setEditingNode] = React.useState(false)

  const path = [{_key: value._key}]

  const handleOpen = (): void => {
    setEditingNode(true)
  }

  const handleClose = (): void => {
    setEditingNode(false)
  }

  return (
    <div>
      {isEditingNode && (
        <EditObject
          value={value}
          type={type}
          path={path}
          referenceElement={referenceElement}
          readOnly={readOnly}
          markers={markers}
          focusPath={focusPath}
          onFocus={onFocus}
          onBlur={onBlur}
          handleChange={handleChange}
          handleClose={handleClose}
        />
      )}
      <ObjectPreview
        type={type}
        value={value}
        path={path}
        readOnly={readOnly}
        onFocus={onFocus}
        onClickingDelete={handleChange}
        onClickingEdit={handleOpen}
      />
    </div>
  )
}
