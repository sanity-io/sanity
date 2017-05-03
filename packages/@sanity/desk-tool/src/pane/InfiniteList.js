import PropTypes from 'prop-types'
import React from 'react'
import Infinite from 'react-infinite'
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
    elements: []
  }

  componentWillMount() {
    this.setState({
      elements: this.props.items.map(this.createListElement)
    })
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.items !== nextProps.items) {
      this.setState({
        elements: nextProps.items.map(this.createListElement)
      })
    }
  }

  createListElement = (item, i) => {
    const {getItemKey} = this.props
    return (
      <div className="infinite-list-item" key={getItemKey(item)}>
        {this.props.renderItem(item, i)}
      </div>
    )
  }

  render() {
    const {listLayout, height, className} = this.props
    const {elements} = this.state
    return (
      <Infinite
        className={className}
        elementHeight={listLayout === 'default' ? 40 : 80}
        containerHeight={height - 65}
        infiniteLoadBeginEdgeOffset={200}
        onInfiniteLoad={this.handleInfiniteLoad}
      >
        {elements}
      </Infinite>
    )
  }
})
