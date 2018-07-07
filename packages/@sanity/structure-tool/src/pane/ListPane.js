import React from 'react'
import PropTypes from 'prop-types'
import {withRouterHOC} from 'part:@sanity/base/router'
import DefaultPane from 'part:@sanity/components/panes/default'
import PaneItem from './PaneItem'

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
      options: PropTypes.shape({
        items: PropTypes.arrayOf(
          PropTypes.shape({
            id: PropTypes.string.isRequired,
            title: PropTypes.string.isRequired,
            schemaType: PropTypes.shape({name: PropTypes.string})
          })
        )
      }),
      isCollapsed: PropTypes.bool.isRequired,
      onExpand: PropTypes.func,
      onCollapse: PropTypes.func
    }

    static defaultProps = {
      className: '',
      options: {items: []},
      styles: undefined,
      onExpand: undefined,
      onCollapse: undefined
    }

    itemIsSelected(item) {
      const {router, index} = this.props
      const selected = (router.state.panes || [])[index]
      return item.id === selected
    }

    getLinkStateForItem = name => {
      if (!name) {
        throw new Error('Tried to get link state item for falsey value')
      }

      const {router, index} = this.props
      const panes = (router.state.panes || []).slice(0, index).concat(name)
      return {panes}
    }

    render() {
      const {
        title,
        styles,
        className,
        options,
        index,
        isCollapsed,
        onCollapse,
        onExpand
      } = this.props

      return (
        <DefaultPane
          title={title}
          styles={styles}
          className={className}
          isCollapsed={isCollapsed}
          onCollapse={onCollapse}
          onExpand={onExpand}
        >
          {options.items.map(item => (
            <PaneItem
              key={item.id}
              id={item.id}
              index={index}
              value={item}
              isSelected={this.itemIsSelected(item)}
              getLinkState={this.getLinkStateForItem}
              schemaType={item.schemaType}
            />
          ))}
        </DefaultPane>
      )
    }
  }
)
