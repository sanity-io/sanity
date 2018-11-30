import React from 'react'
import PropTypes from 'prop-types'
import {withRouterHOC} from 'part:@sanity/base/router'
import DefaultPane from 'part:@sanity/components/panes/default'
import PaneItem from './PaneItem'
import ListView from './ListView'

// eslint-disable-next-line react/prefer-stateless-function
export default withRouterHOC(
  class ListPane extends React.PureComponent {
    static propTypes = {
      index: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      className: PropTypes.string,
      styles: PropTypes.object, // eslint-disable-line react/forbid-prop-types
      router: PropTypes.shape({
        state: PropTypes.shape({
          panes: PropTypes.arrayOf(PropTypes.string)
        })
      }).isRequired,
      defaultLayout: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
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
      const {router, index} = this.props
      const selected = (router.state.panes || [])[index]
      return item.id === selected
    }

    getLinkStateForItem = name => {
      const {router, index} = this.props
      const panes = (router.state.panes || []).slice(0, index).concat(name)
      return {panes}
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
            {items.map(item => (
              <PaneItem
                key={item.id}
                id={item.id}
                index={index}
                value={item}
                icon={this.shouldShowIconForItem(item)}
                layout={defaultLayout}
                isSelected={this.itemIsSelected(item)}
                getLinkState={this.getLinkStateForItem}
                schemaType={item.schemaType}
              />
            ))}
          </ListView>
        </DefaultPane>
      )
    }
  }
)
