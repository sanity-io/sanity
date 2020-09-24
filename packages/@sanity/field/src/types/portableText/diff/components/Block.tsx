import React from 'react'
import {DiffTooltip, useDiffAnnotationColor} from '../../../../diff'
import {isHeader} from '../helpers'
import {PortableTextBlock, PortableTextDiff} from '../types'
import styles from './Block.css'
import Blockquote from './Blockquote'
import Header from './Header'
import Paragraph from './Paragraph'

export default function Block({
  diff,
  block,
  children
}: {
  diff: PortableTextDiff
  block: PortableTextBlock
  children: React.ReactNode[]
}): JSX.Element {
  const color = useDiffAnnotationColor(diff, [])
  const classNames = [styles.root, diff.action, `style_${diff.displayValue.style || 'undefined'}`]
  let returned: React.ReactNode = children
  let fromStyle

  // If style was changed, indicate that
  if (
    diff.origin.action === 'changed' &&
    diff.origin.fields.style &&
    diff.origin.fields.style.action === 'changed'
  ) {
    fromStyle = diff.origin.fromValue.style
    classNames.push(`changed_from_style_${fromStyle || 'undefined'}`)
    const style = color ? {background: color.background, color: color.text} : {}

    returned = (
      <div className={styles.styleIsChanged}>
        <div className={styles.changedBlockStyleNotice}>
          <DiffTooltip diff={diff.origin.fields.style}>
            <div>Changed block style from '{fromStyle}'</div>
          </DiffTooltip>
        </div>
        <div style={style}>{returned}</div>
      </div>
    )
  }

  if (block.style === 'blockquote') {
    returned = <Blockquote>{returned}</Blockquote>
  } else if (block.style && isHeader(block)) {
    returned = <Header style={block.style}>{returned}</Header>
  } else {
    returned = <Paragraph>{returned}</Paragraph>
  }
  return <div className={classNames.join(' ')}>{returned}</div>
}
