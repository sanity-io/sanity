/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, object, boolean, number, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {range} from 'lodash'
import DefaultPane from 'part:@sanity/components/panes/default'
import PanesController from 'part:@sanity/components/panes/controller'
import SplitController from './SplitController'
import Menu from 'part:@sanity/components/menus/default'

const menuItems = [
  {
    title: 'First item',
    key: '1'
  },
  {
    title: 'Second item',
    key: '1'
  },
  {
    title: 'Third item',
    key: '3'
  },
  {
    title: 'Extra item',
    key: '4',
    divider: true
  }
]

const handleMenuAction = menuAction => {
  console.log('action', menuAction)
}

const renderFunctions = () => {
  return (
    <div>functions</div>
  )
}

storiesOf('Panes')
.addDecorator(withKnobs)
.add(
  'Pane',
  () => {
    const renderMenu = pane => {
      return (
        <Menu items={menuItems} onAction={handleMenuAction} />
      )
    }
    return (
      <Sanity part="part:@sanity/components/panes/default" propTables={[DefaultPane]}>
        <DefaultPane
          title={text('title', 'This is the default pane title')}
          isCollapsed={boolean('Is Collapsed?', false)}
          onExpand={action('onExpand')}
          onCollapse={action('onCollapse')}
          minWidth={number('minWidth', 300)}
          renderFunctions={renderFunctions}
          renderMenu={renderMenu}
        />
      </Sanity>
    )
  }
)

.add(
  'Controller',
  () => {
    const panes = range(number('#Panes', 4)).map((pane, i) => {
      return {
        title: `Pane ${i} is the best pane`,
        layout: i > 3 ? 'default' : 'main'
      }
    })

    const renderMenu = pane => {
      return (
        <Menu items={menuItems} onAction={handleMenuAction} />
      )
    }
    const selectedPaneIndex = number('Selected pane', 1)
    const knobsPanes = object('Panes', panes)

    return (
      <Sanity part="part:@sanity/components/panes/controller" propTables={[PanesController]}>
        <PanesController selectedIndex={selectedPaneIndex}>
          {
            knobsPanes.map((pane, i) => {
              return (
                <DefaultPane
                  title={pane.title}
                  key={pane.title}
                  renderFunctions={renderFunctions}
                  renderMenu={renderMenu}
                  onExpand={action('expand')}
                  onCollapse={action('onCollapse')}
                  minWidth={300}
                />
              )
            })
          }
        </PanesController>
      </Sanity>
    )
  }
)


.add(
  'Split',
  () => {
    const panes = range(number('#Panes', 2)).map((pane, i) => {
      return {
        title: `Pane ${i}`,
        key: `pane${i}`,
        minWidth: [100, 100, 400][i] || 300,
        defaultWidth: [200, 200, 700][i] || 300,
      }
    })

    const renderMenu = pane => {
      return (
        <Menu items={menuItems} onAction={handleMenuAction} />
      )
    }
    const selectedPaneIndex = number('Selected pane', 1)
    const knobsPanes = object('Panes', panes)

    return (
      <Sanity part="part:@sanity/components/panes/controller" propTables={[PanesController]}>
        <SplitController selectedIndex={selectedPaneIndex}>
          {
            knobsPanes.map((pane, i) => {
              return (
                <DefaultPane
                  title={pane.title}
                  key={pane.key}
                  minWidth={pane.minWidth}
                  defaultWidth={pane.defaultWidth}
                  renderFunctions={renderFunctions}
                  renderMenu={renderMenu}
                  onExpand={action('expand')}
                  onCollapse={action('onCollapse')}
                >
                  <div>
                    defaultWidth: {pane.defaultWidth}
                  </div>
                  <div>
                    minWidth: {pane.minWidth}
                  </div>
                </DefaultPane>
              )
            })
          }
        </SplitController>
      </Sanity>
    )
  }
)
