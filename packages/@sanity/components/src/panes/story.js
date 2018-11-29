/* eslint-disable react/no-multi-comp, react/prop-types, no-console */
import React from 'react'
import {range} from 'lodash'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, boolean, number, text, object} from 'part:@sanity/storybook/addons/knobs'
import {RouterProvider, route} from 'part:@sanity/base/router'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import DefaultPane from 'part:@sanity/components/panes/default'
import PanesController from 'part:@sanity/components/panes/controller'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import PlusIcon from 'part:@sanity/base/plus-icon'
import TrashIcon from 'part:@sanity/base/trash-outline-icon'
import Button from 'part:@sanity/components/buttons/default'
import renderActionsStyles from './styles/renderActions.css'

const action = event => {
  console.log('action', event)
}

const menuItems = [
  {
    action: 'first',
    title: 'First item',
    key: '1'
  },
  {
    action: 'second',
    title: 'Second item',
    key: '2'
  },
  {
    action: 'third',
    title: 'Third item',
    key: '3',
    params: {some: 'param'}
  },
  {
    action: 'fourth',
    title: 'Extra item',
    key: '4',
    group: 'extra'
  },
  {
    title: 'Add',
    key: '5',
    group: 'actions',
    icon: PlusIcon,
    showAsAction: true,
    action: () => {
      console.log('Function attached to action!')
    }
  }
]

const handleMenuAction = menuAction => {
  console.log('action', menuAction)
}

const router = route('/')
const handleNavigate = () => null

const renderActions = isCollapsed => {
  return (
    <div className={renderActionsStyles.root}>
      <Button
        kind="simple"
        icon={PlusIcon}
        color="primary"
        title="Add"
        className={renderActionsStyles.button}
      />
      <Button
        kind="simple"
        icon={TrashIcon}
        color="danger"
        title="Delete"
        className={renderActionsStyles.button}
      />
    </div>
  )
}

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

storiesOf('Panes')
  .addDecorator(withKnobs)
  .add('Pane', () => {
    return (
      <Sanity part="part:@sanity/components/panes/default" propTables={[DefaultPane]}>
        <RouterProvider
          router={router}
          onNavigate={handleNavigate}
          state={router.decode(location.pathname)}
        >
          <DefaultPane
            title={text('title', 'This is the default pane title', 'props')}
            isCollapsed={boolean('isCollapsed', false, 'props')}
            onExpand={action('onExpand')}
            onCollapse={action('onCollapse')}
            minSize={number('minWidth', 300, 'props')}
            onAction={handleMenuAction}
            menuItems={menuItems}
            renderActions={renderActions}
          />
        </RouterProvider>
      </Sanity>
    )
  })

  .add('Split', () => {
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
      <Sanity part="part:@sanity/components/panes/controller" propTables={[PanesController]}>
        <AutoCollapseTest panes={object('Panes', panes, 'props')} />
      </Sanity>
    )
  })
