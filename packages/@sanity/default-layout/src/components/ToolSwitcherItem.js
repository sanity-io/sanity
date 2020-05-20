import PropTypes from 'prop-types'
import React from 'react'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import {Tooltip} from 'react-tippy'
import styles from './styles/ToolSwitcherItem.css'

function ToolSwitcherItem(props) {
  const {isActive, title, icon, showIcon, showLabel, direction} = props
  const Icon = icon || PluginIcon
  return (
    <Tooltip
      className={`${isActive ? styles.rootActive : styles.root} ${
        direction === 'vertical' ? styles.vertical : styles.horizontal
      }`}
      title={title}
      arrow
      inertia
      theme="dark"
      distance="7"
      sticky
      size="small"
      disabled={showLabel || 'ontouchstart' in document.documentElement}
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

ToolSwitcherItem.propTypes = {
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  isActive: PropTypes.bool,
  title: PropTypes.string.isRequired,
  icon: PropTypes.func,
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool
}

export default ToolSwitcherItem
