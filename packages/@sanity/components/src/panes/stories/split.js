import {range} from 'lodash'
import DefaultPane from 'part:@sanity/components/panes/default'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import {action} from 'part:@sanity/storybook/addons/actions'
import {number, object} from 'part:@sanity/storybook/addons/knobs'
import {DebugRouterProvider} from 'part:@sanity/storybook/components'
import React from 'react'

class AutoCollapseTest extends React.PureComponent {
  state = {
    collapsed: []
  }

  handleCollapse = collapsedPanes => {
    this.setState({collapsed: collapsedPanes})
  }

  handleExpand = collapsedPanes => {
    this.setState({collapsed: collapsedPanes})
  }

  handlePaneCollapse = index => {
    this.setState(prevState => {
      const collapsed = prevState.collapsed.slice()
      collapsed[index] = true
      return {collapsed}
    })
  }

  handlePaneExpand = index => {
    this.setState(prevState => {
      const collapsed = prevState.collapsed.slice()
      collapsed[index] = false
      return {collapsed}
    })
  }

  render() {
    const {panes} = this.props
    const {collapsed} = this.state
    return (
      <SplitController
        onShouldCollapse={this.handleCollapse}
        onShouldExpand={this.handleExpand}
        collapsed={collapsed} // trigger
      >
        {panes.map((pane, i) => {
          return (
            <SplitPaneWrapper
              minSize={pane.minSize}
              defaultSize={pane.defaultSize}
              key={pane.key}
              isCollapsed={pane.isCollapsed}
            >
              <DefaultPane
                index={i}
                title={pane.title}
                minSize={pane.minSize}
                defaultSize={pane.defaultSize}
                onExpand={this.handlePaneExpand}
                onCollapse={this.handlePaneCollapse}
                onMenuToggle={action}
                isCollapsed={pane.isCollapsed}
              >
                <div style={{marginLeft: '1rem', fontFamily: 'monospace'}}>
                  <div>Colapsed: {pane.isCollapsed ? 'true' : 'false'}</div>
                  <div>DefaultSize: {pane.defaultSize}</div>
                  <div>MinSize: {pane.minSize}</div>
                </div>
              </DefaultPane>
            </SplitPaneWrapper>
          )
        })}
      </SplitController>
    )
  }
}

export function SplitStory() {
  const panes = range(number('Panes qty', 4, 'test')).map((pane, i) => {
    return {
      index: i,
      title: `Pane ${i}`,
      key: `pane${i}`,
      isCollapsed: [false][i],
      minSize: [301, 302, 503, 600][i] || 309,
      defaultSize: [401, 402, 403, 800][i] || 309
    }
  })

  return (
    <DebugRouterProvider>
      <AutoCollapseTest panes={object('Panes', panes, 'props')} />
    </DebugRouterProvider>
  )
}
