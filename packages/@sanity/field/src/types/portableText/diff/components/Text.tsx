import classNames from 'classnames'
import {isKeySegment, Path} from '@sanity/types'
import React, {SyntheticEvent, useCallback} from 'react'
import {ConnectorContext} from '@sanity/base/lib/change-indicators'
import {startCase} from 'lodash'
import {DiffCard, DiffContext, StringDiff, StringDiffSegment} from '../../../../diff'
import {PortableTextChild, SpanTypeSchema} from '../types'
import styles from './Text.css'

interface TextProps {
  diff?: StringDiff
  child: PortableTextChild
  children: JSX.Element
  path: Path
  schemaType?: SpanTypeSchema
  segment: StringDiffSegment
}

export function Text({
  diff,
  child,
  children,
  path,
  segment,
  ...restProps
}: TextProps & Omit<React.HTMLProps<HTMLSpanElement>, 'onClick'>) {
  const {onSetFocus} = React.useContext(ConnectorContext)
  const {path: fullPath} = React.useContext(DiffContext)
  const spanSegment = path.slice(-2, 1)[0]
  const className = classNames(styles.root)
  const isRemoved = diff && diff.action === 'removed'
  const prefix = fullPath.slice(
    0,
    fullPath.findIndex(
      seg => isKeySegment(seg) && isKeySegment(spanSegment) && seg._key === spanSegment._key
    )
  )
  const focusPath = prefix.concat(path)

  const diffCard =
    diff && diff.action !== 'unchanged' && segment.action !== 'unchanged' ? (
      <DiffCard
        annotation={diff.annotation}
        as={segment.action === 'removed' ? 'del' : 'ins'}
        tooltip={{description: `${startCase(segment.action)} text`}}
      >
        {children}
      </DiffCard>
    ) : null

  const handleClick = useCallback(
    (event: SyntheticEvent) => {
      if (!isRemoved) {
        onSetFocus(focusPath)
        return
      }
      event.preventDefault()
    },
    [focusPath]
  )
  return (
    <span {...restProps} className={className} onClick={handleClick}>
      <span className={styles.previewContainer}>{diffCard ? diffCard : children}</span>
    </span>
  )
}
