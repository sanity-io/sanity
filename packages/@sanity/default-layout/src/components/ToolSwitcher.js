import PropTypes from 'prop-types'
import React from 'react'
import {StateLink} from 'part:@sanity/base/router'
import styles from './styles/ToolSwitcher.css'
import PluginIcon from 'part:@sanity/base/plugin-icon'

function ToolSwitcher(props) {
  const {tools, activeToolName} = props
  return (
    <div className={`${styles.toolSwitcher} ${props.className}`}>
      <ul className={styles.toolList}>
        {tools.map(tool => {
          const itemClass = (activeToolName === tool.name)
            ? styles.activeItem
            : styles.item

          const ToolIcon = tool.icon || PluginIcon

          return (
            <li key={tool.name} className={itemClass}>
              <StateLink className={styles.toolLink} state={{tool: tool.name}} onClick={props.onClick}>
                <div className={styles.iconContainer}>
                  <ToolIcon />
                </div>
                <div className={styles.toolName}>
                  {tool.title || tool.name}
                </div>
              </StateLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

ToolSwitcher.defaultProps = {
  className: ''
}

ToolSwitcher.propTypes = {
  activeToolName: PropTypes.string,
  onClick: PropTypes.func,
  className: PropTypes.string,
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.func
    })
  )
}

export default ToolSwitcher
