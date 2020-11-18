import {range} from 'lodash'
import Pane from 'part:@sanity/components/panes/default'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import {action} from 'part:@sanity/storybook/addons/actions'
import {number, object} from 'part:@sanity/storybook/addons/knobs'
import {DebugRouterProvider} from 'part:@sanity/storybook/components'
import React from 'react'

import styles from './split.css'

interface PaneType {
  collapsed: boolean
  defaultSize: number
  index: number
  isCollapsed: boolean
  key: string
  minSize: number
  title: string
}

interface Props {
  panes: PaneType[]
}

interface State {
  collapsed: PaneType[]
}

export function SplitStory() {
  const panes = range(number('Panes qty', 4, 'test')).map((pane, i) => {
    return {
      index: i,
      title: `Pane ${i}`,
      key: `pane${i}`,
      isCollapsed: [false][i],
      minSize: [100, 200, 300, 400][i] || 100,
      defaultSize: [400, 400, 400, 800][i] || 400,
    }
  })

  return (
    <DebugRouterProvider>
      <AutoCollapseTest panes={object('Panes', panes, 'props')} />
    </DebugRouterProvider>
  )
}

class AutoCollapseTest extends React.PureComponent<Props, State> {
  state: State = {
    collapsed: [],
  }

  handlePaneCollapse = (index: number) => {
    this.setState((prevState) => {
      const collapsed = prevState.collapsed.slice()
      collapsed[index].collapsed = true
      return {collapsed}
    })
  }

  handlePaneExpand = (index: number) => {
    this.setState((prevState) => {
      const collapsed = prevState.collapsed.slice()
      collapsed[index].collapsed = false
      return {collapsed}
    })
  }

  render() {
    const {panes} = this.props

    return (
      <SplitController>
        {panes.map((pane, i) => {
          return (
            <SplitPaneWrapper minSize={pane.minSize} defaultSize={pane.defaultSize} key={pane.key}>
              <Pane
                index={i}
                title={pane.title}
                onExpand={this.handlePaneExpand}
                onCollapse={this.handlePaneCollapse}
                onAction={action('action')}
                isCollapsed={pane.isCollapsed}
              >
                <div className={styles.root}>
                  <pre>collapsed={pane.isCollapsed ? 'true' : 'false'}</pre>
                  <pre>defaultSize={pane.defaultSize}</pre>
                  <pre>minSize={pane.minSize}</pre>
                </div>
              </Pane>
            </SplitPaneWrapper>
          )
        })}
      </SplitController>
    )
  }
}
