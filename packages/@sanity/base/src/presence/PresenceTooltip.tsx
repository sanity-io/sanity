import {Tooltip, TooltipPlacement} from 'part:@sanity/components/tooltip'
import React from 'react'
import {UserAvatar} from '../components/UserAvatar'
import {FormFieldPresence} from './types'

import styles from './PresenceTooltip.css'

interface PresenceTooltipProps {
  children?: React.ReactElement
  items: FormFieldPresence[]
  placement?: TooltipPlacement
}

export function PresenceTooltip(props: PresenceTooltipProps) {
  const {children, items, placement} = props

  const content = (
    <div className={styles.root}>
      {items.map((item) => (
        <div className={styles.item} key={item.user.id}>
          <div className={styles.avatarContainer}>
            <UserAvatar user={item.user} status="online" />
          </div>

          <div className={styles.textContainer}>
            <div className={styles.item__displayName}>{item.user.displayName}</div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <Tooltip content={content} placement={placement}>
      {children as any}
    </Tooltip>
  )
}
