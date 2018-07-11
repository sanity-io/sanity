/* eslint-disable react/no-multi-comp */
import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, object, boolean, number, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {range} from 'lodash'
import DefaultPane from 'part:@sanity/components/panes/default'
import PanesController from 'part:@sanity/components/panes/controller'
import SplitController from 'part:@sanity/components/panes/split-controller'
import SplitPaneWrapper from 'part:@sanity/components/panes/split-pane-wrapper'
import Menu from 'part:@sanity/components/menus/default'
import MenuDivider from 'part:@sanity/components/menus/divider'
import PlusIcon from 'part:@sanity/base/plus-icon'
import TrashIcon from 'part:@sanity/base/trash-outline-icon'
import Button from 'part:@sanity/components/buttons/default'
import renderFunctionsStyles from './styles/renderFunctions.css'

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
  MenuDivider,
  {
    title: 'Extra item',
    key: '4'
  }
]

const handleMenuAction = menuAction => {
  console.log('action', menuAction)
}

const renderMenu = isCollapsed => {
  return (
    <Menu
      items={menuItems}
      origin={isCollapsed ? 'top-left' : 'top-right'}
      onAction={handleMenuAction}
      isOpen
      onClickOutside={action('Close menu')}
    />
  )
}

const renderFunctions = isCollapsed => {
  return (
    <div className={renderFunctionsStyles.root}>
      <Button
        kind="simple"
        icon={PlusIcon}
        color="primary"
        title="Add"
        className={renderFunctionsStyles.button}
      />
      <Button
        kind="simple"
        icon={TrashIcon}
        color="danger"
        title="Delete"
        className={renderFunctionsStyles.button}
      />
    </div>
  )
}

storiesOf('Panes')
  .addDecorator(withKnobs)
  .add('Pane', () => {
    return (
      <Sanity part="part:@sanity/components/panes/default" propTables={[DefaultPane]}>
        <DefaultPane
          title={text('title (prop)', 'This is the default pane title')}
          isCollapsed={boolean('isCollapsed (prop)', false)}
          onExpand={action('onExpand')}
          onCollapse={action('onCollapse')}
          minWidth={number('minWidth (prop)', 300)}
          renderFunctions={renderFunctions}
          renderMenu={renderMenu}
        />
      </Sanity>
    )
  })

  // .add(
  //   'Controller',
  //   () => {
  //     const panes = range(number('#Panes', 4)).map((pane, i) => {
  //       return {
  //         title: `Pane ${i} is the best pane`,
  //         layout: i > 3 ? 'default' : 'main'
  //       }
  //     })
  //
  //     const selectedPaneIndex = number('Selected pane', 1)
  //     const knobsPanes = object('Panes', panes)
  //
  //     return (
  //       <Sanity part="part:@sanity/components/panes/controller" propTables={[PanesController]}>
  //         <PanesController selectedIndex={selectedPaneIndex}>
  //           {
  //             knobsPanes.map((pane, i) => {
  //               return (
  //                 <DefaultPane
  //                   title={pane.title}
  //                   key={pane.title}
  //                   renderFunctions={renderFunctions}
  //                   renderMenu={renderMenu}
  //                   onExpand={action('expand')}
  //                   onCollapse={action('onCollapse')}
  //                   onMenuToggle={action('onMenuToggle')}
  //                   minWidth={300}
  //                 />
  //               )
  //             })
  //           }
  //         </PanesController>
  //       </Sanity>
  //     )
  //   }
  // )

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
    const showMenu = boolean('Show menu', false)

    const renderSplitMenu = isCollapsed => {
      return (
        <Menu
          items={menuItems}
          origin={isCollapsed ? 'top-left' : 'top-right'}
          onAction={handleMenuAction}
          isOpen={showMenu}
          onClickOutside={action('Close menu')}
        />
      )
    }

    return (
      <Sanity part="part:@sanity/components/panes/controller" propTables={[PanesController]}>
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
                  renderFunctions={renderFunctions}
                  renderMenu={renderSplitMenu}
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
      </Sanity>
    )
  })
