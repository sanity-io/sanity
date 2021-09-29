import React, {FunctionComponent, SyntheticEvent, useCallback, useMemo, useRef} from 'react'
import classNames from 'classnames'
import {Path} from '@sanity/types'
import {
  PortableTextEditor,
  PortableTextBlock,
  Type,
  RenderAttributes,
} from '@sanity/portable-text-editor'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'

import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {hasFocusWithinPath} from '../../../utils/focusUtils'
import {BlockObjectPreview} from './BlockObjectPreview'
import styles from './BlockObject.module.css'

type Props = {
  attributes: RenderAttributes
  blockRef?: React.RefObject<HTMLDivElement>
  editor: PortableTextEditor
  hasError: boolean
  onFocus: (path: Path) => void
  focusPath: Path
  readOnly: boolean
  type: Type
  value: PortableTextBlock
}

export const BlockObject: FunctionComponent<Props> = ({
  attributes: {focused, selected, path},
  blockRef,
  editor,
  focusPath,
  hasError,
  onFocus,
  readOnly,
  type,
  value,
}): JSX.Element => {
  const elementRef = useRef<HTMLDivElement>()

  useScrollIntoViewOnFocusWithin(elementRef, hasFocusWithinPath(focusPath, value))

  const classnames = useMemo(
    () =>
      classNames([
        styles.root,
        focused && styles.focused,
        selected && styles.selected,
        hasError && styles.hasErrors,
      ]),
    [hasError, focused, selected]
  )

  const handleClickToOpen = useCallback(
    (event: SyntheticEvent<HTMLElement>): void => {
      if (focused) {
        event.preventDefault()
        event.stopPropagation()
        onFocus(path.concat(FOCUS_TERMINATOR))
      } else {
        onFocus(path)
      }
    },
    [focused, onFocus, path]
  )

  const handleEdit = useCallback((): void => {
    onFocus(path.concat(FOCUS_TERMINATOR))
  }, [onFocus, path])

  const handleDelete = useCallback(
    () => (): void => {
      PortableTextEditor.delete(
        editor,
        {focus: {path, offset: 0}, anchor: {path, offset: 0}},
        {mode: 'block'}
      )
      PortableTextEditor.focus(editor)
    },
    [editor, path]
  )

  const blockPreview = useMemo(() => {
    return (
      <BlockObjectPreview
        type={type}
        value={value}
        readOnly={readOnly}
        onClickingDelete={handleDelete}
        onClickingEdit={handleEdit}
      />
    )
  }, [type, value, readOnly, handleDelete, handleEdit])
  return (
    <div className={classnames} ref={elementRef} onDoubleClick={handleClickToOpen}>
      <div
        className={styles.previewContainer}
        style={readOnly ? {cursor: 'default'} : {}}
        ref={blockRef}
      >
        {blockPreview}
      </div>
    </div>
  )
}
