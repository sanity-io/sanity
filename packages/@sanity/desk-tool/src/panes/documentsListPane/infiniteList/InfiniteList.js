import PropTypes from 'prop-types'
import React from 'react'
import VirtualList from 'react-tiny-virtual-list'
import enhanceWithAvailHeight from './enhanceWithAvailHeight'
import styles from './InfiniteList.css'

export default enhanceWithAvailHeight(
  class InfiniteList extends React.PureComponent {
    static propTypes = {
      height: PropTypes.number,
      items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
      hasMoreItems: PropTypes.bool,
      isLoadingMore: PropTypes.bool,
      renderItem: PropTypes.func,
      className: PropTypes.string,
      getItemKey: PropTypes.func,
      layout: PropTypes.oneOf(['default', 'detail', 'card', 'media']),
      onScroll: PropTypes.func
    }

    static defaultProps = {
      hasMoreItems: false,
      isLoadingMore: false,
      layout: 'default',
      items: [],
      height: 250
    }

    state = {
      triggerUpdate: 0,
      itemSize: undefined
    }

    // @todo replace this with a something proper. This is hacky.
    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(prevProps) {
      if (prevProps.items !== this.props.items) {
        /**
         * This is needed to break equality checks
         * in VirtualList's sCU in cases where itemCount has not changed,
         * but an elements has been removed or added
         */
        this.setState({triggerUpdate: Math.random()})
      }

      if (prevProps.layout !== this.props.layout) {
        this.setState({
          itemSize: undefined
        })
      }
    }

    setMeasureElement = element => {
      if (element && element.offsetHeight) {
        this.setState({
          itemSize: element.offsetHeight
        })
      }
    }

    renderItem = ({index, style}) => {
      const {renderItem, getItemKey, items, isLoadingMore} = this.props
      if (index === items.length) {
        return (
          <div
            key="more-items"
            style={{...style, height: style.height - 1, lineHeight: `${style.height - 1}px`}}
            className={styles.bottomMetaInfo}
          >
            {isLoadingMore ? 'Loading…' : 'This list contains more documents'}
          </div>
        )
      }

      const item = items[index]
      return (
        <div key={getItemKey(item)} style={style}>
          {renderItem(item, index)}
        </div>
      )
    }

    handleScroll = scrollTop => {
      if (!this.props.onScroll) {
        return
      }

      this.props.onScroll(scrollTop, this.state.itemSize)
    }

    render() {
      const {layout, height, items, className, renderItem, hasMoreItems, isLoadingMore} = this.props
      const {triggerUpdate, itemSize} = this.state
      const addExtraItem = hasMoreItems || isLoadingMore

      if (!items || items.length === 0) {
        return <div />
      }

      if (!itemSize && items) {
        return <div ref={this.setMeasureElement}>{renderItem(items[0], 0)}</div>
      }

      return (
        <VirtualList
          key={layout} // forcefully re-render the whole list when layout changes
          data-trigger-update-hack={triggerUpdate} // see componentWillReceiveProps above
          onScroll={this.handleScroll}
          className={className || ''}
          height={height}
          itemCount={addExtraItem ? items.length + 1 : items.length}
          itemSize={itemSize}
          renderItem={this.renderItem}
          overscanCount={50}
        />
      )
    }
  }
)
