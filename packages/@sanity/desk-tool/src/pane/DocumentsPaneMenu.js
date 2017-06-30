import PropTypes from 'prop-types'
import React from 'react'
import Menu from 'part:@sanity/components/menus/default'

import IconSortAlphaDesc from 'part:@sanity/base/sort-alpha-desc-icon'
import IconList from 'part:@sanity/base/bars-icon'
import IconDetails from 'part:@sanity/base/th-list-icon'
import IconThumbnails from 'part:@sanity/base/th-large-icon'
// import IconSettings from 'part:@sanity/base/cog-icon'
import IconNew from 'part:@sanity/base/plus-circle-icon'

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
  },
  {
    title: 'Create new…',
    icon: IconNew,
    action: 'createNew',
    divider: true
  }
]

export default class DocumentsPaneMenu extends React.PureComponent {

  static propTypes = {
    onSetListLayout: PropTypes.func,
    onSetSorting: PropTypes.func,
    onGoToCreateNew: PropTypes.func,
    onMenuClose: PropTypes.func
  }

  handleMenuAction = item => {
    if (item.action === 'setListLayout') {
      this.props.onSetListLayout(item.key)
    }

    if (item.action === 'setSorting') {
      this.props.onSetSorting(item.sorting)
    }

    if (item.action === 'createNew') {
      this.props.onGoToCreateNew()
    }

    this.props.onMenuClose()
  }

  render() {
    return (
      <Menu
        onAction={this.handleMenuAction}
        items={menuItems}
        origin="top-right"
        {...this.props}
      />
    )
  }
}
