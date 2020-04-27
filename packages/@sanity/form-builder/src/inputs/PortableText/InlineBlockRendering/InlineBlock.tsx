import React, {FunctionComponent} from 'react'
import {isEqual} from 'lodash'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {PortableTextChild, Type, PortableTextBlock} from '@sanity/portable-text-editor'

import {Path} from '../../../typedefs/path'
import Preview from '../../../Preview'

type Props = {
  block: PortableTextBlock
  child: PortableTextChild
  type: Type
  readOnly: boolean
  attributes: {}
  onFocus: (arg0: Path) => void
}

export const InlineBlock: FunctionComponent<Props> = ({
  block,
  child,
  type,
  readOnly,
  attributes,
  onFocus
}) => {
  // const validation = markers.filter(marker => marker.type === 'validation')
  // const errors = validation.filter(marker => marker.level === 'error')
  // const classnames = classNames([
  //   styles.root,
  //   editor.value.selection.focus.isInNode(node) && styles.focused,
  //   isSelected && styles.selected,
  //   errors.length > 0 && styles.hasErrors
  // ])

  const focusPath = [{_key: block._key}, 'children', {_key: child._key}, FOCUS_TERMINATOR]

  const handleEditStart = (): any => {
    setTimeout(() => {
      onFocus(focusPath)
    }, 100)
  }

  const handleView = (): any => {
    onFocus(focusPath)
  }

  const valueKeys = child ? Object.keys(child) : []
  const isEmpty = !child || isEqual(valueKeys.sort(), ['_key', '_type'].sort())
  return (
    <span
      {...attributes}
      // className={classnames}
      contentEditable={false}
    >
      <span
        onClick={readOnly ? handleView : handleEditStart}
        // className={styles.previewContainer}
        style={readOnly ? {cursor: 'default'} : {}}
      >
        {!isEmpty && <Preview type={type} value={child} layout="inline" />}
        {isEmpty && !readOnly && <span>Click to edit</span>}
      </span>
    </span>
  )
}
