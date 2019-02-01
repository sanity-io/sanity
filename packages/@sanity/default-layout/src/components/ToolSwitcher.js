import PropTypes from 'prop-types'
import React from 'react'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import ToolSwitcherWidget from './ToolSwitcherWidget'
import ToolSwitcherItem from './ToolSwitcherItem'
import ToolSwitcherWidgetStyles from './styles/ToolSwitcherWidget.css'

class ToolSwitcher extends React.PureComponent {
  renderItem = (tool, showIcon) => {
    const {activeToolName, router, isVisible, onSwitchTool, direction, showLabel} = this.props
    const tabIndex = isVisible ? '0' : '-1'
    let linkState = tool.state

    // Reset tool when clicking current tool
    if (router.state.tool === tool.state.tool) {
      linkState = {tool: tool.state.tool, space: tool.state.space}
    }
    return (
      <StateLink
        state={linkState}
        onClick={onSwitchTool}
        className={ToolSwitcherWidgetStyles.link}
        tabIndex={tabIndex}
      >
        <ToolSwitcherItem
          direction={direction}
          icon={tool.icon}
          showIcon={showIcon}
          showLabel={showLabel}
          title={tool.title || tool.name}
          label={tool.title || tool.name}
          isActive={activeToolName === tool.name}
        />
      </StateLink>
    )
  }

  render() {
    const {router, tools} = this.props
    return (
      <ToolSwitcherWidget
        {...this.props}
        renderItem={this.renderItem}
        tools={tools.map(tool => {
          return {
            state: router && Object.assign({}, router.state, {tool: tool.name}),
            ...tool
          }
        })}
      />
    )
  }
}

ToolSwitcher.defaultProps = {
  direction: 'horizontal',
  tools: []
}

ToolSwitcher.propTypes = {
  activeToolName: PropTypes.string,
  onSwitchTool: PropTypes.func,
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  router: PropTypes.shape({state: PropTypes.object}),
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      icon: PropTypes.func
    })
  )
}

export default withRouterHOC(ToolSwitcher)
