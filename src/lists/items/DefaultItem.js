import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'
import ReactDOM from 'react-dom'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    onSelect: PropTypes.func.isRequired,
    item: PropTypes.object,
    layout: PropTypes.string,
    selected: PropTypes.bool,
    highlighted: PropTypes.bool,
    scrollIntoView: PropTypes.func,
    decoration: PropTypes.oneOf(['default', 'zebra-stripes'])
  }

  static defaultProps = {
    onSelect() {},
    decoration: 'default'
  }

  state = {
    mouseIsDown: false
  }

  handleClick = event => {
    this.props.onSelect(this.props.item)
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

  componentDidMount() {
    this.ensureVisible()
  }

  componentDidUpdate() {
    this.ensureVisible()
  }

  ensureVisible() {
    if (this.props.selected) {
      this.props.scrollIntoView(ReactDOM.findDOMNode(this))
    }
  }

  render() {
    const {item, selected, highlighted, className, decoration} = this.props
    const {mouseIsDown} = this.state

    const rootClasses = `
      ${decoration && styles[decoration]}
      ${highlighted && styles.highlighted}
      ${selected && styles.selected}
      ${mouseIsDown && styles.active}
      ${className}
    `
    return (
      <li className={rootClasses} onClick={this.handleClick} data-item-key={item.key} onMouseDown={this.handleMouseDown}>
        {this.props.children}
      </li>
    )
  }
}
