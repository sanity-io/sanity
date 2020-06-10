import React from 'react'
import styles from './ToolSwitcherWidget.css'
import {Tool} from '../../types'

interface Props {
  activeToolName: string
  renderItem: (tool: Tool, showIcon: boolean, showLabel: boolean) => React.ReactNode
  direction: 'vertical' | 'horizontal'
  tone?: 'navbar'
  tools: Tool[]
}

function ToolSwitcherWidget(props: Props) {
  const {tools, direction, renderItem} = props
  const showIcon = true
  const showLabel = direction === 'vertical'

  return (
    <ul
      className={direction === 'horizontal' ? styles.rootHorizontal : styles.rootVertical}
      data-tone="navbar"
    >
      {tools.map(tool => {
        return (
          <li key={tool.name} className={styles.item}>
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
