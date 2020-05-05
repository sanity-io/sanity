/* eslint-disable react/prop-types */
import React, {FunctionComponent, SyntheticEvent} from 'react'
import classNames from 'classnames'
import {PortableTextBlock, Type, RenderAttributes} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

import {Marker} from '../../../typedefs'
import {Path} from '../../../typedefs/path'
import {PatchEvent, unset} from '../../../PatchEvent'
import {BlockObjectPreview} from './BlockObjectPreview'
import styles from './BlockObject.css'

type Props = {
  type: Type
  value: PortableTextBlock
  attributes: RenderAttributes
  readOnly: boolean
  markers: Marker[]
  focusPath: Path
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onFocus: (arg0: Path) => void
}

export const BlockObject: FunctionComponent<Props> = ({
  type,
  value,
  attributes: {focused, selected, path},
  readOnly,
  markers,
  onChange,
  onFocus
}): JSX.Element => {
  const validation = markers.filter(marker => marker.type === 'validation')
  const errors = validation.filter(marker => marker.level === 'error')
  const classnames = classNames([
    styles.root,
    focused && styles.focused,
    selected && styles.selected,
    errors.length > 0 && styles.hasErrors
  ])

  const handleClickToOpen = (event: SyntheticEvent<HTMLElement>): void => {
    if (focused) {
      event.preventDefault()
      event.stopPropagation()
      onFocus(path.concat(FOCUS_TERMINATOR))
    } else {
      onFocus(path)
    }
  }

  const handleEdit = (): void => {
    onFocus(path.concat(FOCUS_TERMINATOR))
  }

  const handleDelete = (): void => {
    onChange(PatchEvent.from([unset()]), path)
  }

  return (
    <div className={classnames} onClick={handleClickToOpen}>
      <div className={styles.previewContainer} style={readOnly ? {cursor: 'default'} : {}}>
        <BlockObjectPreview
          type={type}
          value={value}
          path={path}
          readOnly={readOnly}
          onFocus={onFocus}
          onClickingDelete={handleDelete}
          onClickingEdit={handleEdit}
        />
      </div>
    </div>
  )
}
