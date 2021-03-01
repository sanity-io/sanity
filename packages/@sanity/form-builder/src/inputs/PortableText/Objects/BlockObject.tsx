/* eslint-disable react/prop-types */
import React, {FunctionComponent, SyntheticEvent, useMemo, useRef} from 'react'
import classNames from 'classnames'
import {Path, Marker, isValidationErrorMarker} from '@sanity/types'
import {
  PortableTextEditor,
  PortableTextBlock,
  Type,
  RenderAttributes,
} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

import {PatchEvent} from '../../../PatchEvent'

import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {hasFocusWithinPath} from '../../../utils/focusUtils'
import {BlockObjectPreview} from './BlockObjectPreview'
import styles from './BlockObject.css'

type Props = {
  attributes: RenderAttributes
  editor: PortableTextEditor
  markers: Marker[]
  onChange: (patchEvent: PatchEvent, path: Path) => void
  onFocus: (path: Path) => void
  focusPath: Path
  readOnly: boolean
  type: Type
  value: PortableTextBlock
}

export const BlockObject: FunctionComponent<Props> = ({
  attributes: {focused, selected, path},
  editor,
  markers,
  focusPath,
  onFocus,
  readOnly,
  type,
  value,
}): JSX.Element => {
  const elementRef = useRef()

  useScrollIntoViewOnFocusWithin(elementRef, hasFocusWithinPath(focusPath, value))

  const errors = markers.filter(isValidationErrorMarker)
  const classnames = classNames([
    styles.root,
    focused && styles.focused,
    selected && styles.selected,
    errors.length > 0 && styles.hasErrors,
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
    PortableTextEditor.delete(
      editor,
      {focus: {path, offset: 0}, anchor: {path, offset: 0}},
      {mode: 'block'}
    )
    PortableTextEditor.focus(editor)
  }
  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        type={type}
        value={value}
        path={path}
        readOnly={readOnly}
        onFocus={onFocus}
        onClickingDelete={handleDelete}
        onClickingEdit={handleEdit}
      />
    )
  }, [value, readOnly])
  return (
    <div className={classnames} ref={elementRef} onDoubleClick={handleClickToOpen}>
      <div className={styles.previewContainer} style={readOnly ? {cursor: 'default'} : {}}>
        {blockPreview}
      </div>
    </div>
  )
}
