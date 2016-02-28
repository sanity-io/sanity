import React from 'react'
import isPlainObject from 'lodash.isplainobject'

function reinsert(arr, from, to) {
  const _arr = arr.slice(0)
  const val = _arr[from]
  _arr.splice(from, 1)
  _arr.splice(to, 0, val)
  return _arr
}


const keyForObject = (function () {
  const SORT_ORDER_ID = Symbol('SORT_ORDER_ID')
  let nextId = 1
  return function _keyForObject(object) {
    if (isPlainObject(object)) {
      if (!object[SORT_ORDER_ID]) {
        object[SORT_ORDER_ID] = nextId++
      }
      return object[SORT_ORDER_ID]
    }
    return void 0
  }
})()

export default React.createClass({
  displayName: 'Sortable',
  getInitialState() {
    return {
      draggingIndex: null,
      dragOverIndex: null,
      order: null,
      itemKeys: this.props.value.map((v, i) => i)
    }
  },
  reorder(fromIndex, toIndex) {
    const {value} = this.props
    const itemKeys = value.map((v, i) => i)
    this.setState({
      order: reinsert(value, fromIndex, toIndex),
      itemKeys: reinsert(itemKeys, fromIndex, toIndex)
    })
  },

  handleDrop(index, event) {
    event.preventDefault()
    this.props.onChange(this.state.order)
    this.setState(this.getInitialState())
  },

  handleDragEnter(index, event) {
    event.preventDefault()
    const {draggingIndex} = this.state
    this.reorder(draggingIndex, index)
  },

  handleDrag(index, event) {
    event.preventDefault()
  },

  handleDragOver(index, event) {
    event.preventDefault()
  },

  handleDragStart(index, event) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', null)
    this.setState({draggingIndex: index})
  },

  handleDragEnd(index, event) {
    this.setState(this.getInitialState())
  },

  componentWillReceiveProps() {
    this.setState(this.getInitialState())
  },

  render() {
    const {value, className, style, renderItem, renderSeparator} = this.props

    const {order, draggingIndex, dragOverIndex} = this.state

    const items = order || value

    return (
      <div className={className} style={style}>
        {items.map((item, i) => {
          const [first, last] = [i == 0, i == items.length - 1]
          const dragged = draggingIndex == i
          const draggedOver = dragOverIndex == i
          const key = keyForObject(item)
          /* eslint-disable react/jsx-no-bind */
          return (
            <div key={key}>
              {renderSeparator(item, i, {after: false, before: true, first, last})}
              <div
                draggable={true}
                canDrop="true"
                className="form-list__sortable-item"
                dragging={draggingIndex == i}
                onDrag={this.handleDrag.bind(null, i)}
                onDrop={this.handleDrop.bind(null, i)}
                onDragStart={this.handleDragStart.bind(null, i)}
                onDragEnd={this.handleDragEnd.bind(null, i)}
                onDragEnter={this.handleDragEnter.bind(null, i)}
                onDragOver={this.handleDragOver.bind(null, i)}
              >
                {renderItem(item, i, {dragged, draggedOver, first, last})}
              </div>
              {renderSeparator(item, i, {after: true, before: false, first, last})}
            </div>
          )
          /* eslint-enable react/jsx-no-bind */
        })}
      </div>
    )
  }
})
