import PropTypes from 'prop-types'
import React from 'react'
import Menu from 'part:@sanity/components/menus/default'

import IconList from 'part:@sanity/base/bars-icon'
import IconDetails from 'part:@sanity/base/th-list-icon'
import IconThumbnails from 'part:@sanity/base/th-large-icon'
// import IconSettings from 'part:@sanity/base/cog-icon'
import IconNew from 'part:@sanity/base/plus-circle-icon'

const menuItems = [
  // Todo: Disabled for now as we need to rethink how sorting should
  // work wrt. previews and what is actually displayed on screen

  // {
  //   title: 'Alphabetical',
  //   icon: IconSortAlphaDesc,
  //   action: 'setSorting',
  //   key: 'byAlphabetical',
  //   sorting: 'name'
  // },
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
  // Disabled for now as it needs more work (virtual-list support, etc.)
  __DEV__ && {
    title: 'Thumbnails (__DEV__ only)',
    icon: IconThumbnails,
    action: 'setListLayout',
    key: 'media'

  },
  // Disabled for now as it needs more work (virtual-list support, etc.)
  __DEV__ && {
    title: 'Cards (__DEV__ only)',
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
].filter(Boolean)

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
