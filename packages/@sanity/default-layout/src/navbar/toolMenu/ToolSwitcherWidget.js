import PropTypes from 'prop-types'
import React from 'react'
import styles from './ToolSwitcherWidget.css'

function ToolSwitcherWidget(props) {
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

ToolSwitcherWidget.propTypes = {
  activeToolName: PropTypes.string,
  renderItem: PropTypes.func.isRequired,
  direction: PropTypes.oneOf(['vertical', 'horizontal']),
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.func
    })
  )
}

ToolSwitcherWidget.defaultProps = {
  activeToolName: undefined,
  tools: [],
  direction: 'horizontal'
}

export default ToolSwitcherWidget
