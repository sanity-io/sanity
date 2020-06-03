import React from 'react'
import {Tooltip as BaseTooltip} from 'react-tippy'

import styles from './Tooltip.css'

export function Tooltip(props: {
  children: React.ReactNode
  className?: string
  content: React.ReactNode
  disabled?: boolean
}) {
  return (
    <BaseTooltip
      className={props.className}
      disabled={props.disabled}
      html={
        <div className={styles.root}>
          <span>{props.content}</span>
        </div>
      }
      arrow
      inertia
      theme="dark"
      distance={7}
      sticky
      size="small"
    >
      {props.children}
    </BaseTooltip>
  )
}
