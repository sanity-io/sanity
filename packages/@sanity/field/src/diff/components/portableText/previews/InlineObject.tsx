import React, {SyntheticEvent} from 'react'
import styles from './InlineObject.css'
import {PortableTextChild} from '../types'
import {DiffAnnotationTooltip, ObjectDiff, useDiffAnnotationColor} from '../../../index'

type Props = {
  diff?: ObjectDiff
  object: PortableTextChild
  onClick?: (event: SyntheticEvent<HTMLSpanElement>) => void
  children?: React.ReactNode
}
export default function InlineObject(props: Props) {
  const children = props.children || props.object._type
  const {diff, onClick} = props
  let returned = <span className={styles.root}>{children}</span>
  if (diff) {
    const color = useDiffAnnotationColor(diff, [])
    const style = color ? {background: color.background, color: color.text} : {}
    const classNames = [styles.root, ...[diff.action === 'removed' ? [styles.removed] : []]].join(
      ' '
    )

    // Click handler
    const handleClick = onClick
      ? (event: SyntheticEvent<HTMLSpanElement>) => {
          onClick(event)
        }
      : () => {}

    // Wrap in inline object
    returned = (
      <span className={classNames} style={style} onClick={handleClick}>
        {children}
      </span>
    )
    // Wrap in tooltip
    returned = (
      <DiffAnnotationTooltip diff={diff} as={'span'}>
        {returned}
      </DiffAnnotationTooltip>
    )
  }
  return returned
}
