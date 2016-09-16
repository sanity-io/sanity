import React, {PropTypes} from 'react'
import Menu from 'component:@sanity/components/menus/default'

import IconSortAlphaDesc from 'icon:@sanity/sort-alpha-desc'
import IconList from 'icon:@sanity/bars'
import IconDetails from 'icon:@sanity/th-list'
import IconThumbnails from 'icon:@sanity/th-large'
import IconSettings from 'icon:@sanity/cog'

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
