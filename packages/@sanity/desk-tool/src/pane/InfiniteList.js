import PropTypes from 'prop-types'
import React from 'react'
import VirtualList from 'react-tiny-virtual-list'

import enhanceWithAvailHeight from './enhanceWithAvailHeight'


export default enhanceWithAvailHeight(class InfiniteList extends React.PureComponent {

  static propTypes = {
    height: PropTypes.number,
    items: PropTypes.array, // eslint-disable-line react/forbid-prop-types
    renderItem: PropTypes.func,
    className: PropTypes.string,
    getItemKey: PropTypes.func,
    listLayout: PropTypes.oneOf(['default', 'media', 'cards', 'media']),
  }

  static defaultProps = {
    listLayout: 'default',
    items: [],
    height: 250
  }

  state = {
    triggerUpdate: 0
  }

  componentWillReceiveProps(prevProps) {
    if (prevProps.items !== this.props.items) {
      /* This is needed to break equality checks
       in VirtualList's sCU in cases where itemCount has not changed,
       but an elements has been removed or added
       */
      this.setState({triggerUpdate: Math.random()})
    }
  }

  renderItem = ({index, style}) => {
    const {renderItem, getItemKey, items} = this.props
    const item = items[index]
    return (
      <div key={getItemKey(item)} style={style}>
        {renderItem(item, index)}
      </div>
    )
  }

  render() {
    const {listLayout, height, items, className} = this.props
    const {triggerUpdate} = this.state
    return (
      <VirtualList
        className={`${className || ''} _triggerUpdate_${triggerUpdate}`}
        height={height - 65}
        itemCount={items.length}
        itemSize={listLayout === 'default' ? 40 : 80}
        renderItem={this.renderItem}
      />
    )
  }
})
