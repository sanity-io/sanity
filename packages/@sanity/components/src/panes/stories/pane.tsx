import ComposeIcon from 'part:@sanity/base/compose-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import Button from 'part:@sanity/components/buttons/default'
import Pane from 'part:@sanity/components/panes/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {DebugRouterProvider} from 'part:@sanity/storybook/components'
import React from 'react'
import {MenuItem} from '../../menus/types'

import styles from './pane.css'

const menuItems: MenuItem[] = [
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
    icon: ComposeIcon,
    showAsAction: true,
    action: action('Add')
  }
]

const renderActions = () => {
  return [
    <Button
      color="primary"
      icon={ComposeIcon}
      key="add"
      kind="simple"
      padding="small"
      title="Add"
    />,
    <Button
      color="danger"
      icon={TrashIcon}
      key="delete"
      kind="simple"
      padding="small"
      title="Delete"
    />
  ]
}

export function PaneStory() {
  return (
    <Sanity part="part:@sanity/components/panes/default" propTables={[Pane]}>
      <DebugRouterProvider>
        <Pane
          index={0}
          title={text('title', 'This is the default pane title', 'props')}
          isCollapsed={boolean('isCollapsed', false, 'props')}
          onExpand={action('onExpand')}
          onCollapse={action('onCollapse')}
          onAction={action('onAction')}
          menuItems={menuItems}
          renderActions={renderActions}
        >
          <div className={styles.root}>
            <div className={styles.text}>Contents</div>
          </div>
        </Pane>
      </DebugRouterProvider>
    </Sanity>
  )
}
