import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'

export default class BlankListItem extends React.Component {
  static propTypes = {
    selected: PropTypes.bool,
    onSelect: PropTypes.func,
    index: PropTypes.string,
    children: PropTypes.node
  }

  static defaultProps = {
    onSelect() {}
  }

  state = {
    mouseIsDown: false
  }

  handleClick = event => {
    this.props.onSelect(event)
  }

  handleMouseDown = event => {
    this.setState({
      mouseIsDown: true
    })
    window.addEventListener('mouseup', this.handleMouseUp)
  }

  handleMouseUp = event => {
    this.setState({
      mouseIsDown: false
    })
    window.removeEventListener('mouseup', this.handleMouseUp)
  }

  render() {
    const {selected, children} = this.props
    const {mouseIsDown} = this.state

    const rootClasses = `
      ${styles.root}
      ${selected ? styles.selected : styles.unSelected}
      ${mouseIsDown && styles.active}
    `
    return (
      <li
        className={rootClasses}
        onClick={this.handleClick}
        onMouseDown={this.handleMouseDown}
      >
        {children}
      </li>
    )
  }
}
