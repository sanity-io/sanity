import React from 'react'
import PropTypes from 'prop-types'
import DefaultPane from 'part:@sanity/components/panes/default'
import listStyles from 'part:@sanity/components/lists/default-style'
import {PaneRouterContext} from '../../contexts/PaneRouterContext'
import {PaneItem} from '../../components/paneItem'
import {ListView} from '../../components/listView'

export default class ListPane extends React.PureComponent {
  static contextType = PaneRouterContext

  static propTypes = {
    index: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    childItemId: PropTypes.string.isRequired,
    className: PropTypes.string,
    styles: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    defaultLayout: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        schemaType: PropTypes.shape({name: PropTypes.string})
      })
    ),
    menuItems: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired
      })
    ),
    menuItemGroups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired
      })
    ),
    displayOptions: PropTypes.shape({
      showIcons: PropTypes.bool
    }),
    isSelected: PropTypes.bool.isRequired,
    isCollapsed: PropTypes.bool.isRequired,
    onExpand: PropTypes.func,
    onCollapse: PropTypes.func
  }

  static defaultProps = {
    className: '',
    items: [],
    menuItems: [],
    menuItemGroups: [],
    displayOptions: {},
    styles: undefined,
    onExpand: undefined,
    onCollapse: undefined,
    defaultLayout: undefined
  }

  itemIsSelected(item) {
    return this.props.childItemId === item.id
  }

  shouldShowIconForItem = item => {
    const paneShowIcons = this.props.displayOptions.showIcons
    const itemShowIcon = item.displayOptions && item.displayOptions.showIcon

    // Specific true/false on item should have presedence over list setting
    if (typeof itemShowIcon !== 'undefined') {
      return itemShowIcon === false ? false : item.icon
    }

    // If no item setting is defined, defer to the pane settings
    return paneShowIcons === false ? false : item.icon
  }

  render() {
    const {
      title,
      styles,
      className,
      defaultLayout,
      items,
      index,
      menuItems,
      menuItemGroups,
      isSelected,
      isCollapsed,
      onCollapse,
      onExpand
    } = this.props

    return (
      <DefaultPane
        index={index}
        title={title}
        styles={styles}
        className={className}
        isSelected={isSelected}
        isCollapsed={isCollapsed}
        onCollapse={onCollapse}
        onExpand={onExpand}
        menuItems={menuItems}
        menuItemGroups={menuItemGroups}
      >
        <ListView layout={defaultLayout}>
          {items.map(item =>
            item.type === 'divider' ? (
              <hr key={item.id} className={listStyles.divider} />
            ) : (
              <PaneItem
                key={item.id}
                id={item.id}
                index={index}
                value={item}
                icon={this.shouldShowIconForItem(item)}
                layout={defaultLayout}
                isSelected={this.itemIsSelected(item)}
                schemaType={item.schemaType}
              />
            )
          )}
        </ListView>
      </DefaultPane>
    )
  }
}
