import React, {PropTypes} from 'react'
import {StateLink} from 'part:@sanity/base/router'
import styles from './styles/ToolSwitcher.css'

class ToolSwitcher extends React.Component {

  static propTypes = {
    activeToolName: PropTypes.string,
    tools: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        icon: PropTypes.func.isRequired
      })
    )
  }

  render() {
    const {tools, activeToolName} = this.props
    return (
      <div className={styles.toolSwitcher}>
        <ul className={styles.toolList}>
          {tools.map(tool => {
            const itemClass = activeToolName === tool.name
              ? styles.activeItem
              : styles.item

            const ToolIcon = tool.icon

            return (
              <li key={tool.name} className={itemClass}>
                <StateLink className={styles.toolLink} state={{tool: tool.name}}>
                  <div className={styles.iconContainer}>
                    <ToolIcon />
                  </div>
                  <div className={styles.toolName}>
                    {tool.name}
                  </div>
                </StateLink>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default ToolSwitcher
