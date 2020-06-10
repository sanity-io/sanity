import classNames from 'classnames'
import React from 'react'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import {Tooltip} from '../tooltip'
import styles from './ToolSwitcherItem.css'

interface Props {
  title: string
  icon: React.ComponentType<{}>
  selected: boolean
  showIcon: boolean
  showLabel: boolean
  tone?: 'navbar'
}

const TOUCH_DEVICE = 'ontouchstart' in document.documentElement

function ToolSwitcherItem(props: Props) {
  const {selected, title, icon, showIcon, showLabel} = props
  const Icon = icon || PluginIcon

  return (
    <Tooltip
      className={classNames(styles.root, selected && styles.selected)}
      content={title}
      disabled={TOUCH_DEVICE || showLabel}
      key={showLabel ? 'tippy' : 'tippy-disabled'}
      title={showLabel ? '' : title}
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
  selected: false,
  showIcon: true,
  showLabel: true,
  direction: 'horizontal'
}

export default ToolSwitcherItem
