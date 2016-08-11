import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/lists/items/default'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    content: PropTypes.node,
    extraContent: PropTypes.node,
    icon: PropTypes.node,
    layout: PropTypes.string,
    selected: PropTypes.bool,
    onSelect: PropTypes.func,
    index: PropTypes.string
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

  handleMouseDown() {
    this.setState({
      mouseIsDown: true
    })
  }
  handleMouseUp() {
    this.setState({
      mouseIsDown: false
    })
  }

  render() {
    const {layout, title, icon, selected, index} = this.props
    const {mouseIsDown} = this.state

    const rootClasses = `
      ${styles[layout] || styles.root}
      ${selected ? styles.selected : styles.unSelected}
      ${mouseIsDown && styles.active}
    `
    return (
      <li
        className={rootClasses}
        onClick={this.handleClick}
        data-item-index={index}
        onMouseDown={this.handleMouseDown}
        onMouseUp={this.handleMouseUp}
      >
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
      </li>
    )
  }
}
