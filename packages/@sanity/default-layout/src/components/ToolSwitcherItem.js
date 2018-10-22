import PropTypes from 'prop-types'
import React from 'react'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import Ink from 'react-ink'
import styles from './styles/ToolSwitcherItem.css'

function ToolSwitcherItem(props) {
  const {isActive, title, icon} = props
  const Icon = icon || PluginIcon
  return (
    <div className={isActive ? styles.rootActive : styles.root}>
      <div className={styles.iconContainer}>
        <Icon />
      </div>
      <div className={styles.toolName}>{title}</div>
      <Ink duration={1000} opacity={0.1} radius={200} />
    </div>
  )
}

ToolSwitcherItem.defaultProps = {
  // layout: 'default',
  tool: {},
  isActive: false
}

ToolSwitcherItem.propTypes = {
  isActive: PropTypes.bool,
  // layout: PropTypes.oneOf(['mini', 'default']),
  title: PropTypes.string.isRequired,
  icon: PropTypes.func
}

export default ToolSwitcherItem
