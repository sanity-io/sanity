/* eslint-disable react/prop-types */
import React, {FunctionComponent, SyntheticEvent, useCallback, useMemo} from 'react'
import classNames from 'classnames'
import {PortableTextChild, RenderAttributes} from '@sanity/portable-text-editor'

import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Path} from '@sanity/types'

import styles from './Annotation.module.css'

type Props = {
  value: PortableTextChild
  children: JSX.Element
  attributes: RenderAttributes
  hasError: boolean
  onFocus: (path: Path) => void
}

export const Annotation: FunctionComponent<Props> = ({
  children,
  hasError,
  attributes: {focused, selected, path},
  value,
  onFocus,
}) => {
  const classnames = useMemo(
    () =>
      classNames([
        styles.root,
        focused && styles.focused,
        selected && styles.selected,
        hasError ? styles.error : styles.valid,
      ]),
    [hasError, focused, selected]
  )

  const markDefPath = useMemo(() => [...path.slice(0, 1), 'markDefs', {_key: value._key}], [
    path,
    value._key,
  ])

  const handleOnClick = useCallback(
    (event: SyntheticEvent<HTMLSpanElement>): void => {
      event.preventDefault()
      event.stopPropagation()
      onFocus(markDefPath.concat(FOCUS_TERMINATOR))
    },
    [markDefPath, onFocus]
  )
  return (
    <span className={classnames} onClick={handleOnClick}>
      {children}
    </span>
  )
}
