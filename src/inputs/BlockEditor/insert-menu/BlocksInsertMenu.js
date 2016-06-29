import React, {PropTypes} from 'react'
import BlocksInsertMenuItem from './BlocksInsertMenuItem'
import {map} from 'lodash'

export default React.createClass({
  propTypes: {
    items: PropTypes.array,
    open: PropTypes.bool,
    handleToggle: PropTypes.func
  },

  render() {
    const buttonStyle = {
      border: 0,
      background: 'black',
      width: 20,
      height: 20,
      lineHeight: '0.8em',
      borderRadius: 10,
      color: 'white'
    }

    const itemsStyle = {
      position: 'absolute',
      top: 0,
      left: '100%',
      display: this.props.open ? 'block' : 'none'
    }

    const items = map(this.props.items, (item, i) => (
      <BlocksInsertMenuItem key={i} handleClick={item.onClick}>
        {item.label}
      </BlocksInsertMenuItem>
    ))

    return (
      <div>
        <button style={buttonStyle} onClick={this.props.handleToggle}>+</button>

        <div style={itemsStyle}>
          {items}
        </div>
      </div>
    )
  }
})
