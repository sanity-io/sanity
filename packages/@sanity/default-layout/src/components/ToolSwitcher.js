import React from 'react'
import styles from '../styles/ToolSwitcher.css'

const ToolSwitcher = ({tools, activeTool}) =>
  <ul className={styles.switcher}>
    {tools.map(tool => {
      const itemClass = activeTool === tool.name
        ? styles.activeItem
        : styles.item

      const ToolIcon = tool.icon

      return (
        <li className={itemClass}>
          <a href="#" className={styles.toolLink}>
            <ToolIcon />
            {tool.name}
          </a>
        </li>
      )
    })}
  </ul>

export default ToolSwitcher
