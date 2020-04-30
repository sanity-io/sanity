/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'
import classNames from 'classnames'
import {PortableTextBlock, Type} from '@sanity/portable-text-editor'

import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent} from '../../../PatchEvent'
import {ObjectPreview} from './ObjectPreview'
import {EditObject} from './EditObject'

import styles from './styles/Object.css'

type Props = {
  type: Type
  value: PortableTextBlock
  referenceElement: React.RefObject<HTMLDivElement>
  attributes: {
    focused: boolean
    selected: boolean
  }
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
  attributes: {focused, selected},
  readOnly,
  markers,
  focusPath,
  handleChange,
  onFocus,
  onBlur
}): JSX.Element => {
  const [isEditingNode, setEditingNode] = React.useState(false)

  const validation = markers.filter(marker => marker.type === 'validation')
  const errors = validation.filter(marker => marker.level === 'error')
  const classnames = classNames([
    styles.root,
    // focused && styles.focused, // TODO: focused is not the element that is focused, it's the editor. We need the node here.
    selected && styles.selected,
    errors.length > 0 && styles.hasErrors
  ])

  const path = [{_key: value._key}]

  const handleOpen = (): void => {
    setEditingNode(true)
  }

  const handleClose = (): void => {
    setEditingNode(false)
  }

  return (
    <div className={classnames}>
      <div className={styles.previewContainer} style={readOnly ? {cursor: 'default'} : {}}>
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
    </div>
  )
}
