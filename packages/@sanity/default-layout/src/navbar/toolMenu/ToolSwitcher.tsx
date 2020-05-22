import React from 'react'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import ToolSwitcherWidget from './ToolSwitcherWidget'
import ToolSwitcherItem from './ToolSwitcherItem'
import ToolSwitcherWidgetStyles from './ToolSwitcherWidget.css'
import {Router, Tool} from '../../types'

interface Props {
  activeToolName: string
  isVisible: boolean
  onSwitchTool: () => void
  direction: 'horizontal' | 'vertical'
  router: Router
  showLabel?: boolean
  tools: Tool[]
}

const noop = () => undefined

class ToolSwitcher extends React.PureComponent<Props> {
  static defaultProps = {
    activeToolName: undefined,
    direction: 'horizontal',
    isVisible: false,
    onSwitchTool: noop,
    router: undefined,
    showLabel: false,
    tools: []
  }

  renderItem = (tool: Tool, showIcon: boolean) => {
    const {activeToolName, router, isVisible, onSwitchTool, direction, showLabel} = this.props
    const tabIndex = isVisible ? 0 : -1
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
