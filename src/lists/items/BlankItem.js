import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/default'

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

  constructor(...args) {
    super(...args)
    this.handleClick = this.handleClick.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.handleMouseUp = this.handleMouseUp.bind(this)
    this.state = {
      mouseIsDown: false
    }
  }

  handleClick(event) {
    this.props.onSelect(event)
  }

  handleMouseDown(event) {
    this.setState({
      mouseIsDown: true
    })
  }
  handleMouseUp(event) {
    this.setState({
      mouseIsDown: false
    })
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
        onMouseUp={this.handleMouseUp}
      >
        {children}
      </li>
    )
  }
}
