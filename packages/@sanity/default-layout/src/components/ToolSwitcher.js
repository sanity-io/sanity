import React from 'react'
import {Link} from 'router:@sanity/base/router'

import styles from '../../styles/ToolSwitcher.css'

const ToolSwitcher = ({tools, activeToolName}) =>
  <div className={styles.toolSwitcher}>
    <ul className={styles.toolList}>
      {tools.map(tool => {
        const itemClass = activeToolName === tool.name
          ? styles.activeItem
          : styles.item

        const ToolIcon = tool.icon

        return (
          <li key={tool.name} className={itemClass}>
            <Link href={`/${tool.name}`} className={styles.toolLink}>
              <div className={styles.iconContainer}>
                <ToolIcon />
              </div>
              <div className={styles.toolName}>
                {tool.name}
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  </div>

export default ToolSwitcher
