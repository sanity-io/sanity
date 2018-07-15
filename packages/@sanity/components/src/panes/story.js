/* eslint-disable react/no-multi-comp */
import React from 'react'
import {range} from 'lodash'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, object, boolean, number, text} from 'part:@sanity/storybook/addons/knobs'
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

const menuItemsWhenCollapsed = menuItems.map(
  item =>
    item.showAsAction ? Object.assign({}, item, {showAsAction: {whenCollapsed: true}}) : item
)

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
            title={text('title (prop)', 'This is the default pane title')}
            isCollapsed={boolean('isCollapsed (prop)', false)}
            onExpand={action('onExpand')}
            onCollapse={action('onCollapse')}
            minWidth={number('minWidth (prop)', 300)}
            onAction={handleMenuAction}
            menuItems={menuItems}
            renderActions={renderActions}
          />
        </RouterProvider>
      </Sanity>
    )
  })

  .add('Split', () => {
    const panes = range(number('#Panes', 2)).map((pane, i) => {
      return {
        title: `Pane ${i} is a long pane an it has a name and it should cap somewhere`,
        key: `pane${i}`,
        isCollapsed: [true][i],
        minWidth: [100, 100, 400][i] || 300,
        defaultWidth: [200, 200, 700][i] || 300
      }
    })

    const handleControllerCollapse = pane => {
      console.log('handleControllerCollapse', pane)
    }

    const handleControllerUnCollapse = pane => {
      console.log('handleControllerUnCollapse', pane)
    }

    const selectedPaneIndex = number('Selected pane', 1)
    const knobsPanes = object('Panes', panes)
    const actionsWhenCollapsed = boolean('Show actions when collapsed', false)
    const customActionRenderer = boolean('Custom action rendering', false)

    return (
      <Sanity part="part:@sanity/components/panes/controller" propTables={[PanesController]}>
        <RouterProvider
          router={router}
          onNavigate={handleNavigate}
          state={router.decode(location.pathname)}
        >
          <SplitController
            selectedIndex={selectedPaneIndex}
            onCollapse={handleControllerCollapse}
            onUnCollapse={handleControllerUnCollapse}
          >
            {knobsPanes.map((pane, i) => {
              return (
                <SplitPaneWrapper
                  minWidth={pane.minWidth}
                  defaultWidth={pane.defaultWidth}
                  key={pane.key}
                  isCollapsed={pane.isCollapsed}
                >
                  <DefaultPane
                    title={pane.title}
                    renderActions={customActionRenderer ? renderActions : undefined}
                    onAction={handleMenuAction}
                    menuItems={actionsWhenCollapsed ? menuItemsWhenCollapsed : menuItems}
                    onExpand={action('expand')}
                    onCollapse={action('onCollapse')}
                    isCollapsed={pane.isCollapsed}
                    onMenuToggle={action('onMenuToggle')}
                  >
                    <div>defaultWidth: {pane.defaultWidth}</div>
                    <div>minWidth: {pane.minWidth}</div>
                  </DefaultPane>
                </SplitPaneWrapper>
              )
            })}
          </SplitController>
        </RouterProvider>
      </Sanity>
    )
  })
