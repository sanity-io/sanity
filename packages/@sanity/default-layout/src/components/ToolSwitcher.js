import React, {PropTypes} from 'react'
import pluginConfig from 'config:@sanity/default-layout'
import {StateLink} from 'part:@sanity/base/router'
import styles from './styles/ToolSwitcher.css'

class ToolSwitcher extends React.PureComponent {
  static propTypes = {
    activeToolName: PropTypes.string,
    onClick: PropTypes.func,
    className: PropTypes.string,
    tools: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        icon: PropTypes.func.isRequired
      })
    )
  }

  getOrderedTools() {
    const tools = this.props.tools
    const config = pluginConfig.toolSwitcher || {}
    const order = config.order || []
    const hidden = config.hidden || []

    if (!order.length && !hidden.length) {
      return tools
    }

    const keyed = tools.reduce((target, tool) => {
      const title = tool.title || '<unknown>'

      if (!tool.name) {
        console.warn(`Tool "${title}" does not have the required "name"-property`) // eslint-disable-line no-console
        return target
      }

      if (target[tool.name]) {
        const existing = target[tool.name].tool.title
        console.warn(`Tools with duplicate name "${tool.name}" found ("${title}" and "${existing}")`) // eslint-disable-line no-console
        return target
      }

      const toolIndex = order.indexOf(tool.name)
      target[tool.name] = {
        tool: tool,
        index: toolIndex === -1 ? +Infinity : toolIndex
      }
      return target
    }, {})

    const isVisible = tool => hidden.indexOf(tool.name) === -1

    return tools.filter(isVisible).sort((tool1, tool2) => {
      const toolA = keyed[tool1.name]
      const toolB = keyed[tool2.name]

      const indexA = toolA ? toolA.index : +Infinity
      const indexB = toolB ? toolB.index : +Infinity

      if (indexA === indexB) {
        return 0
      }

      return indexA - indexB
    })
  }

  render() {
    const {activeToolName} = this.props
    const tools = this.getOrderedTools()
    return (
      <div className={`${styles.toolSwitcher} ${this.props.className}`}>
        <ul className={styles.toolList}>
          {tools.map(tool => {
            const itemClass = activeToolName === tool.name
              ? styles.activeItem
              : styles.item

            const ToolIcon = tool.icon

            return (
              <li key={tool.name} className={itemClass}>
                <StateLink className={styles.toolLink} state={{tool: tool.name}} onClick={this.props.onClick}>
                  <span className={styles.iconContainer}>
                    <ToolIcon />
                  </span>
                  <span className={styles.toolName}>
                    {tool.title || tool.name}
                  </span>
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
