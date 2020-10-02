import classNames from 'classnames'
import {startCase} from 'lodash'
import {isKeySegment, Path} from '@sanity/types'
import React, {useCallback} from 'react'
import {ConnectorContext} from '@sanity/base/lib/change-indicators'
import {DiffContext} from '../../../../diff'
import {SpanTypeSchema} from '../types'
import styles from './Text.css'

interface TextProps {
  children: JSX.Element
  path: Path
  schemaType?: SpanTypeSchema
}

export function Text({
  children,
  path,
  ...restProps
}: TextProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const {onSetFocus} = React.useContext(ConnectorContext)
  const {path: fullPath} = React.useContext(DiffContext)
  const spanSegment = path.slice(-2, 1)[0]
  const className = classNames(styles.root)
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex(
      seg => isKeySegment(seg) && isKeySegment(spanSegment) && seg._key === spanSegment._key
    )
  )
  const focusPath = prefix.concat(path)

  const handleClick = useCallback(() => {
    onSetFocus(focusPath)
  }, [focusPath])
  return (
    <span {...restProps} className={className} onClick={handleClick}>
      <span className={styles.previewContainer}>{children}</span>
    </span>
  )
}
