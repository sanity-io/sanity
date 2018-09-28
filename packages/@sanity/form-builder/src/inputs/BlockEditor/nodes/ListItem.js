// @flow
import type {Node} from 'react'

import React from 'react'
import styles from './styles/ListItem.css'

const LIST_ITEM_TYPES = ['bullet', 'number', 'roman']

type Props = {
  listStyle: string,
  level: number,
  children: Node,
  blockExtras: Node,
  attributes?: {}
}

export default function ListItem(props: Props) {
  const attributes = props.attributes || {}
  const {listStyle, level} = props
  if (!LIST_ITEM_TYPES.includes(listStyle)) {
    throw new Error(
      `Don't know how to handle listItem '${listStyle}'. ` +
        `Expected one of '${LIST_ITEM_TYPES.join("', '")}'`
    )
  }
  const className = `${styles[listStyle]} ${styles[`level-${level}`]}`
  return (
    <div className={className} {...attributes}>
      <div className={styles.item}>{props.children}</div>
      {props.blockExtras}
    </div>
  )
}
