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
                icon={item.icon}
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
