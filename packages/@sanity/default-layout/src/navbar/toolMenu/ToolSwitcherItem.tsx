import React from 'react'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import {Tooltip} from '../tooltip'
import styles from './ToolSwitcherItem.css'

interface Props {
  direction: 'horizontal' | 'vertical'
  isActive: boolean
  title: string
  icon: React.ComponentType<{}>
  showIcon: boolean
  showLabel: boolean
}

const TOUCH_DEVICE = 'ontouchstart' in document.documentElement

function ToolSwitcherItem(props: Props) {
  const {isActive, title, icon, showIcon, showLabel, direction} = props
  const Icon = icon || PluginIcon

  return (
    <Tooltip
      className={`${isActive ? styles.rootActive : styles.root} ${
        direction === 'vertical' ? styles.vertical : styles.horizontal
      }`}
      content={title}
      disabled={TOUCH_DEVICE || showLabel}
    >
      <div className={styles.inner} tabIndex={-1}>
        <div>
          {showIcon && (
            <div className={styles.iconContainer}>
              <Icon />
            </div>
          )}
          {showLabel && <div className={styles.toolName}>{title}</div>}
        </div>
      </div>
    </Tooltip>
  )
}

ToolSwitcherItem.defaultProps = {
  isActive: false,
  showIcon: true,
  showLabel: true,
  direction: 'horizontal'
}

export default ToolSwitcherItem
