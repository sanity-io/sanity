import {Marker, Path} from '@sanity/types'
import classNames from 'classnames'
import React, {useRef, useEffect, useCallback} from 'react'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import WarningOutlineIcon from 'part:@sanity/base/warning-outline-icon'

import styles from './ValidationListItem.css'

interface ValidationListItemProps {
  hasFocus?: boolean
  kind?: 'simple'
  marker: Marker
  onClick?: (path?: Path) => void
  path: string
  // showLink?: boolean
  truncate?: boolean
}

function ValidationListItem(props: ValidationListItemProps) {
  const {hasFocus, kind, marker, onClick, path, truncate} = props
  const hasOnClick = Boolean(props.onClick)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const hasFocusRef = useRef(hasFocus || false)

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && onClick) {
        onClick(marker.path)
      }
    },
    [marker.path, onClick]
  )

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(marker.path)
    }
  }, [marker.path, onClick])

  useEffect(() => {
    if (hasFocusRef.current !== hasFocus) {
      if (hasFocus && rootRef.current) rootRef.current.focus()
      hasFocusRef.current = hasFocus || false
    }
  }, [hasFocus])

  const children = (
    <>
      <span className={styles.icon}>
        {marker.level === 'error' && <ErrorOutlineIcon />}
        {marker.level === 'warning' && <WarningOutlineIcon />}
      </span>

      <div className={styles.content}>
        {path && <div className={styles.path}>{path}</div>}
        {marker.item.message && <div className={styles.message}>{marker.item.message}</div>}
      </div>
    </>
  )

  const className = classNames(
    hasOnClick ? styles.interactive : styles.root,
    marker.level && styles[marker.level],
    truncate && styles.truncate,
    styles[`kind_${kind}`]
  )

  if (!hasOnClick) {
    return (
      <div data-item-type={kind} ref={rootRef} className={className}>
        {children}
      </div>
    )
  }

  return (
    // @todo: use a <button> element
    <div
      // data-item-type={kind}
      ref={rootRef}
      tabIndex={0}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      className={className}
    >
      {children}
    </div>
  )
}

export default ValidationListItem
