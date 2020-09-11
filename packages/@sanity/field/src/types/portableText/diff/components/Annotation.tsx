import React, {SyntheticEvent} from 'react'
import {PortableTextBlock, PortableTextChild} from '../types'
import styles from './Annotation.css'

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {}

type Props = {
  // eslint-disable-next-line react/no-unused-prop-types
  block: PortableTextBlock
  children: React.ReactNode
  // eslint-disable-next-line react/no-unused-prop-types
  markDefKey: string
  onClick?: (event: SyntheticEvent<HTMLSpanElement>) => void
  // eslint-disable-next-line react/no-unused-prop-types
  span: PortableTextChild
}

export default function Annotation(props: Props): JSX.Element {
  const {onClick} = props

  // Click handler
  const handleClick = onClick
    ? (event: SyntheticEvent<HTMLSpanElement>) => {
        onClick(event)
      }
    : noop

  return (
    <span className={styles.root} onClick={handleClick}>
      {props.children}
    </span>
  )
}
