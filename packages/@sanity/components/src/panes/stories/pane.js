import PlusIcon from 'part:@sanity/base/plus-icon'
// import TrashIcon from 'part:@sanity/base/trash-outline-icon'
// import Button from 'part:@sanity/components/buttons/default'
import DefaultPane from 'part:@sanity/components/panes/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, number, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {DebugRouterProvider} from 'part:@sanity/storybook/components'
import React from 'react'

// import styles from './pane.css'

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
    action: action('Add')
  }
]

// const router = route('/')
// const handleNavigate = () => null

// const renderActions = isCollapsed => {
//   return (
//     <div className={styles.root}>
//       <Button kind="simple" icon={PlusIcon} color="primary" title="Add" className={styles.button} />
//       <Button
//         kind="simple"
//         icon={TrashIcon}
//         color="danger"
//         title="Delete"
//         className={styles.button}
//       />
//     </div>
//   )
// }

export function PaneStory() {
  return (
    <Sanity part="part:@sanity/components/panes/default" propTables={[DefaultPane]}>
      <DebugRouterProvider>
        <div style={{background: 'red', padding: '1em'}}>
          <DefaultPane
            title={text('title', 'This is the default pane title', 'props')}
            isCollapsed={boolean('isCollapsed', false, 'props')}
            onExpand={action('onExpand')}
            onCollapse={action('onCollapse')}
            minSize={number('minWidth', 300, 'props')}
            onAction={action('onAction')}
            menuItems={menuItems}
            // renderActions={renderActions}
          >
            <p>Contents</p>
          </DefaultPane>
        </div>
      </DebugRouterProvider>
    </Sanity>
  )
}
