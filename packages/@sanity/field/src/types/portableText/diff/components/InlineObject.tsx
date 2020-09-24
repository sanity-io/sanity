import classNames from 'classnames'
import React from 'react'
import {PortableTextChild} from '../types'
import {DiffTooltip, ObjectDiff, useDiffAnnotationColor} from '../../../../diff'

import styles from './InlineObject.css'

interface InlineObjectProps {
  diff?: ObjectDiff
  object: PortableTextChild
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void
  children?: React.ReactNode
}

export function InlineObject({children: childrenProp, diff, object, onClick}: InlineObjectProps) {
  const children = childrenProp || object._type

  if (diff) {
    return <InlineObjectWithDiff diff={diff} object={object} />
  }

  return (
    <span className={styles.root} onClick={onClick}>
      {children}
    </span>
  )
}

interface InlineObjectWithDiffProps {
  diff: ObjectDiff
  object: PortableTextChild
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void
  children?: React.ReactNode
}

function InlineObjectWithDiff({
  children: childrenProp,
  diff,
  object,
  onClick
}: InlineObjectWithDiffProps) {
  const children = childrenProp || object._type
  const color = useDiffAnnotationColor(diff, [])
  const style = color ? {background: color.background, color: color.text} : {}
  const className = classNames(styles.root, diff.action === 'removed' && styles.removed)

  return (
    <DiffTooltip diff={diff}>
      <span className={className} style={style} onClick={onClick}>
        {children}
      </span>
    </DiffTooltip>
  )
}
