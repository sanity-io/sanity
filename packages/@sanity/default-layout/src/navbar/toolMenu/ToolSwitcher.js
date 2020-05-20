import PropTypes from 'prop-types'
import React from 'react'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import ToolSwitcherWidget from './ToolSwitcherWidget'
import ToolSwitcherItem from './ToolSwitcherItem'
import ToolSwitcherWidgetStyles from './ToolSwitcherWidget.css'

const noop = () => undefined

class ToolSwitcher extends React.PureComponent {
  static propTypes = {
    activeToolName: PropTypes.string,
    isVisible: PropTypes.bool,
    onSwitchTool: PropTypes.func,
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
    router: PropTypes.shape({state: PropTypes.object}),
    showLabel: PropTypes.bool,
    tools: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        icon: PropTypes.func
      })
    )
  }

  static defaultProps = {
    activeToolName: undefined,
    direction: 'horizontal',
    isVisible: false,
    onSwitchTool: noop,
    router: undefined,
    showLabel: false,
    tools: []
  }

  renderItem = (tool, showIcon) => {
    const {activeToolName, router, isVisible, onSwitchTool, direction, showLabel} = this.props
    const tabIndex = isVisible ? '0' : '-1'
    return (
      <StateLink
        state={{
          ...router.state,
          tool: tool.name,
          [tool.name]: undefined
        }}
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
    const {tools} = this.props

    if (!tools || tools.length <= 1) return null

    return <ToolSwitcherWidget {...this.props} renderItem={this.renderItem} tools={tools} />
  }
}

export default withRouterHOC(ToolSwitcher)
