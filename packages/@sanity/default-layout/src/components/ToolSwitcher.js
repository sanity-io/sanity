import PropTypes from 'prop-types'
import React from 'react'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import Ink from 'react-ink'
import styles from './styles/ToolSwitcher.css'

function ToolSwitcher(props) {
  const {tools, router, activeToolName, onSwitchTool, layout,} = props
  return (
    <div className={styles[layout]}>
      <ul className={styles.toolList}>
        {tools.map(tool => {
          const itemClass = activeToolName === tool.name ? styles.activeItem : styles.item

          const ToolIcon = tool.icon || PluginIcon

          const state = Object.assign({}, router.state, {tool: tool.name})
          return (
            <li key={tool.name} className={itemClass}>
              <StateLink className={styles.toolLink} state={state} onClick={onSwitchTool}>
                <div className={styles.iconContainer}>
                  <ToolIcon />
                </div>
                <div className={styles.toolName}>{tool.title || tool.name}</div>
                <Ink duration={1000} opacity={0.1} radius={200} />
              </StateLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

ToolSwitcher.defaultProps = {
  layout: 'default'
}

ToolSwitcher.propTypes = {
  activeToolName: PropTypes.string,
  onSwitchTool: PropTypes.func,
  layout: PropTypes.oneOf(['mini', 'default']),
  router: PropTypes.shape({state: PropTypes.object}),
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.func
    })
  )
}

export default withRouterHOC(ToolSwitcher)
