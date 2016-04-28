import React from 'react'
import {Link} from 'router:@sanity/base/router'

import styles from '../styles/ToolSwitcher.css'

const ToolSwitcher = ({tools, activeToolName}) =>
  <ul className={styles.switcher}>
    {tools.map(tool => {
      const itemClass = activeToolName === tool.name
        ? styles.activeItem
        : styles.item

      const ToolIcon = tool.icon

      return (
        <li key={tool.name} className={itemClass}>
          <Link href={`/${tool.name}`} className={styles.toolLink}>
            <ToolIcon />
            {tool.name}
          </Link>
        </li>
      )
    })}
  </ul>

export default ToolSwitcher
