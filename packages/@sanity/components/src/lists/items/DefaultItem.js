import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'
import {item as itemPropType} from '../PropTypes'

export default class DefaultItem extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    item: itemPropType,
    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
    hasFocus: PropTypes.bool
  }

  static defaultProps = {
    onSelect() {},
    decoration: 'default'
  }

  handleClick = () => {
    this.props.onSelect(this.props.item)
  }

  handleDoubleClick = () => {
    this.props.onOpen(this.props.item)
  }

  handleKeyPress = event => {
    if (event.key === 'Enter') {
      this.props.onSelect(this.props.item)
    }
  }

  setElement = domElement => {
    this._domElement = domElement
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.hasFocus && this.props.hasFocus) {
      this._domElement.focus()
    }
  }

  render() {
    return (
      <div
        tabIndex="0"
        className={styles.noLink}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
        onKeyPress={this.handleKeyPress}
        ref={this.setElement}
      >
        {this.props.children}
      </div>
    )
  }
}
