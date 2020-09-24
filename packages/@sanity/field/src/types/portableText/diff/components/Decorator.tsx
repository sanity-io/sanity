import React from 'react'
import {DiffCard, StringDiff} from '../../../../diff'
import styles from './Decorator.css'

export default function Decorator({
  diff,
  mark,
  children
}: {
  diff?: StringDiff
  mark: string
  text: string
  children: JSX.Element
}) {
  let returned = children
  const isRemoved = diff && diff.action === 'removed'
  if (diff && diff.action !== 'unchanged') {
    returned = (
      <DiffCard
        annotation={diff.annotation}
        as="span"
        tooltip={{description: `Formatting ${diff.action}`}}
      >
        {returned}
      </DiffCard>
    )
  }
  if (!isRemoved) {
    returned = <span className={`${styles[mark]}`}>{returned}</span>
  }
  return returned
}
