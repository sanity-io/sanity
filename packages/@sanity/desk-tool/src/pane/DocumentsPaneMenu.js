import PropTypes from 'prop-types'
import React from 'react'
import Menu from 'part:@sanity/components/menus/default'

import IconList from 'part:@sanity/base/bars-icon'
import IconDetails from 'part:@sanity/base/th-list-icon'
import IconThumbnails from 'part:@sanity/base/th-large-icon'
// import IconSettings from 'part:@sanity/base/cog-icon'
import IconNew from 'part:@sanity/base/plus-circle-icon'

const TEST_CARDS_AND_THUMBNAILS = false

const LIST_VIEW_ITEMS = [
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
  TEST_CARDS_AND_THUMBNAILS && {
    title: 'Thumbnails (__DEV__ only)',
    icon: IconThumbnails,
    action: 'setListLayout',
    key: 'media'
  },
  // Disabled for now as it needs more work (virtual-list support, etc.)
  TEST_CARDS_AND_THUMBNAILS && {
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

const NULL_COMPONENT = () => null

export default class DocumentsPaneMenu extends React.PureComponent {
  static propTypes = {
    onSetListLayout: PropTypes.func,
    onSetOrdering: PropTypes.func,
    onGoToCreateNew: PropTypes.func,
    onMenuClose: PropTypes.func,
    orderingOptions: PropTypes.array
  }

  handleMenuAction = item => {
    if (item.action === 'setListLayout') {
      this.props.onSetListLayout(item)
    }

    if (item.action === 'setOrdering') {
      this.props.onSetOrdering(item.ordering)
    }

    if (item.action === 'createNew') {
      this.props.onGoToCreateNew()
    }
    this.props.onMenuClose()
  }

  render() {
    const {orderingOptions} = this.props
    const orderingItems = orderingOptions
      .map(orderingOption => ({
        title: orderingOption.title,
        icon: orderingOption.icon || NULL_COMPONENT,
        ordering: orderingOption,
        action: 'setOrdering',
        active: orderingOption.active,
        key: orderingOption.name
      }))
      .concat(LIST_VIEW_ITEMS)

    return (
      <Menu
        onAction={this.handleMenuAction}
        items={orderingItems}
        origin="top-right"
        {...this.props}
      />
    )
  }
}
