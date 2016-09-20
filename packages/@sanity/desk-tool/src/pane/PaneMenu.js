import React, {PropTypes} from 'react'
import Menu from 'part:@sanity/components/menus/default'

import IconSortAlphaDesc from 'part:@sanity/base/sort-alpha-desc-icon'
import IconList from 'part:@sanity/base/bars-icon'
import IconDetails from 'part:@sanity/base/th-list-icon'
import IconThumbnails from 'part:@sanity/base/th-large-icon'
import IconSettings from 'part:@sanity/base/cog-icon'

class PaneMenu extends React.Component {

  static propTypes = {
    opened: PropTypes.bool,
    onClickOutside: PropTypes.func
  }

  constructor(...args) {
    super(...args)
    this.handleItemClick = this.handleItemClick.bind(this)
  }

  handleItemClick(item) {
    // Handle item click
  }


  render() {

    const menuItems = [
      {
        title: 'Alphabetical',
        icon: IconSortAlphaDesc,
        index: 'sortByAlphabetical'
      },
      {
        title: 'Last edited',
        icon: undefined,
        index: 'sortByLastEdited'
      },
      {
        title: 'Created',
        icon: undefined,
        index: 'sortByCreated'
      },
      {
        title: 'List',
        icon: IconList,
        index: 'showList',
        divider: true
      },
      {
        title: 'Details',
        icon: IconDetails,
        index: 'showDetails'
      },
      {
        title: 'Thumbnails',
        icon: IconThumbnails,
        index: 'showThumbnails'

      },
      {
        title: 'Settings',
        icon: IconSettings,
        index: 'goToSettings',
        divider: true
      }
    ]

    const {opened} = this.props

    return (
      <Menu
        onAction={this.handleItemClick}
        items={menuItems}
        opened={opened}
        origin="top-right"
        onClickOutside={this.props.onClickOutside}
      />
    )
  }
}

export default PaneMenu
