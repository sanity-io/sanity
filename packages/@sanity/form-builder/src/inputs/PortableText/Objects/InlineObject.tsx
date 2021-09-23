/* eslint-disable react/prop-types */
import React, {FunctionComponent, useCallback, useMemo} from 'react'
import {isEqual} from 'lodash'
import classNames from 'classnames'
import {PortableTextChild, Type, RenderAttributes} from '@sanity/portable-text-editor'
import {Path} from '@sanity/types'

import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import Preview from '../../../Preview'

import styles from './InlineObject.module.css'

type Props = {
  value: PortableTextChild
  type: Type
  attributes: RenderAttributes
  readOnly: boolean
  hasError: boolean
  onFocus: (path: Path) => void
}

export const InlineObject: FunctionComponent<Props> = ({
  attributes: {focused, selected, path},
  hasError,
  onFocus,
  readOnly,
  type,
  value,
}) => {
  const classnames = useMemo(
    () =>
      classNames([
        styles.root,
        focused && styles.focused,
        selected && styles.selected,
        hasError && styles.hasErrors,
      ]),
    [focused, hasError, selected]
  )
  const handleOpen = useCallback((): void => {
    if (focused) {
      onFocus(path.concat(FOCUS_TERMINATOR))
    }
  }, [focused, onFocus, path])

  const isEmpty = useMemo(() => !value || isEqual(Object.keys(value), ['_key', '_type']), [value])
  const style = useMemo(() => (readOnly ? {cursor: 'default'} : {}), [readOnly])
  const inline = useMemo(
    () => (
      <span className={classnames} onClick={handleOpen}>
        <span
          className={styles.previewContainer}
          style={style} // TODO: Probably move to styles aka. className?
        >
          {!isEmpty && <Preview type={type} value={value} layout="inline" />}
          {isEmpty && !readOnly && <span>Click to edit</span>}
        </span>
      </span>
    ),
    [classnames, handleOpen, isEmpty, readOnly, style, type, value]
  )

  return inline
}
