import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/ToolSwitcherWidget.css'

function ToolSwitcherWidget(props) {
  const {tools, activeToolName, renderItem} = props
  return (
    <div className={styles.root}>
      <ul className={styles.toolList}>
        {tools.map(tool => {
          const itemClass = activeToolName === tool.name ? styles.activeItem : styles.item
          return (
            <li key={tool.name} className={itemClass}>
              {renderItem(tool)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

ToolSwitcherWidget.defaultProps = {
  tools: []
}

ToolSwitcherWidget.propTypes = {
  activeToolName: PropTypes.string,
  renderItem: PropTypes.func,
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.func
    })
  )
}

export default ToolSwitcherWidget
