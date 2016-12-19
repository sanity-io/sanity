import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'

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
    decoration: PropTypes.oneOf(['default', 'zebra-stripes', 'divider'])
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
  }

  handleMouseUp = event => {
    this.setState({
      mouseIsDown: false
    })
  }

  componentDidMount() {
    this.ensureVisible()
    window.addEventListener('mouseup', this.handleMouseUp)
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.handleMouseUp)
  }

  setElement = element => {
    this._element = element
  }

  ensureVisible() {
    const {selected, scrollIntoView} = this.props
    if (selected && scrollIntoView) {
      // TODO fix this
      // Hack because the ref in defaultlist is called after this
      setTimeout(() => {
        scrollIntoView(this._element)
      }, 0)
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
      <li className={rootClasses} onClick={this.handleClick} data-item-key={item.key} onMouseDown={this.handleMouseDown} ref={this.setElement}>
        {this.props.children}
      </li>
    )
  }
}
