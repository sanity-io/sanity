import PropTypes from 'prop-types'
import React from 'react'
import Menu from 'part:@sanity/components/menus/default'

import IconSortAlphaDesc from 'part:@sanity/base/sort-alpha-desc-icon'
import IconList from 'part:@sanity/base/bars-icon'
import IconDetails from 'part:@sanity/base/th-list-icon'
import IconThumbnails from 'part:@sanity/base/th-large-icon'
import IconSettings from 'part:@sanity/base/cog-icon'

const menuItems = [
  {
    title: 'Alphabetical',
    icon: IconSortAlphaDesc,
    action: 'setSorting',
    key: 'byAlphabetical',
    sorting: 'name'
  },
  {
    title: 'Last edited',
    icon: undefined,
    action: 'setSorting',
    key: 'byLastEdited',
    sorting: '_updatedAt desc'
  },
  {
    title: 'Created',
    icon: undefined,
    action: 'setSorting',
    key: 'byCreated',
    sort: '_createdAt desc'
  },
  {
    title: 'List',
    icon: IconList,
    action: 'setListLayout',
    key: 'default',
    divider: true
  },
  {
    title: 'Details',
    icon: IconDetails,
    action: 'setListLayout',
    key: 'detail'
  },
  {
    title: 'Thumbnails',
    icon: IconThumbnails,
    action: 'setListLayout',
    key: 'media'

  },
  {
    title: 'Cards',
    icon: IconThumbnails,
    action: 'setListLayout',
    key: 'card'

  }
]

function PaneMenu(props) {
  return (
    <Menu
      onAction={props.onAction}
      opened={props.opened}
      items={menuItems}
      origin="top-right"
    />
  )
}

PaneMenu.propTypes = {
  opened: PropTypes.bool,
  onAction: PropTypes.func
}

export default PaneMenu
