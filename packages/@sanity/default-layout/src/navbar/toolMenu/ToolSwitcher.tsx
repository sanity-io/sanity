import React from 'react'
import {StateLink, withRouterHOC} from 'part:@sanity/base/router'
import ToolSwitcherWidget from './ToolSwitcherWidget'
import ToolSwitcherItem from './ToolSwitcherItem'
import {Router, Tool} from '../../types'

import styles from './ToolSwitcher.css'

interface Props {
  activeToolName: string
  isVisible: boolean
  onSwitchTool: () => void
  direction: 'horizontal' | 'vertical'
  router: Router
  showLabel?: boolean
  tone?: 'navbar'
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

  renderItem = (tool: Tool, showIcon: boolean, overrideShowLabel?: boolean) => {
    const {activeToolName, router, isVisible, onSwitchTool, showLabel, tone} = this.props
    const tabIndex = isVisible ? 0 : -1

    return (
      <StateLink
        state={{...router.state, tool: tool.name, [tool.name]: undefined}}
        onClick={onSwitchTool}
        className={styles.link}
        tabIndex={tabIndex}
      >
        <ToolSwitcherItem
          icon={tool.icon}
          showIcon={showIcon}
          showLabel={showLabel || overrideShowLabel}
          title={tool.title || tool.name || undefined}
          tone={tone}
          selected={activeToolName === tool.name}
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
