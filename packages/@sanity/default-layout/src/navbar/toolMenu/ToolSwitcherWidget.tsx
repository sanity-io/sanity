import React from 'react'
import styles from './ToolSwitcherWidget.css'
import {Tool} from '../../types'

interface Props {
  activeToolName: string
  renderItem: (tool: Tool, showIcon: boolean, showLabel: boolean) => React.ReactNode
  direction: 'vertical' | 'horizontal'
  tools: Tool[]
}

function ToolSwitcherWidget(props: Props) {
  const {tools, direction, activeToolName, renderItem} = props
  const showIcon = true
  const showLabel = direction === 'vertical'
  return (
    <ul className={direction === 'horizontal' ? styles.rootHorizontal : styles.rootVertical}>
      {tools.map(tool => {
        const itemClass = activeToolName === tool.name ? styles.activeItem : styles.item
        return (
          <li key={tool.name} className={itemClass}>
            {renderItem(tool, showIcon, showLabel)}
          </li>
        )
      })}
    </ul>
  )
}

ToolSwitcherWidget.defaultProps = {
  activeToolName: undefined,
  tools: [],
  direction: 'horizontal'
}

export default ToolSwitcherWidget
