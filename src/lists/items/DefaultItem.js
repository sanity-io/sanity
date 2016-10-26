import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'
import ReactDOM from 'react-dom'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    onSelect: PropTypes.func.isRequired,
    item: PropTypes.shape({
      title: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired
    }),
    layout: PropTypes.string,
    selected: PropTypes.bool,
    highlighted: PropTypes.bool,
    scrollIntoView: PropTypes.func
  }

  static defaultProps = {
    onSelect() {}
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
    const {item, layout, selected, highlighted} = this.props
    const {mouseIsDown} = this.state

    const rootClasses = `
      ${styles[layout] || styles.default}
      ${selected ? styles.selected : styles.unSelected}
      ${highlighted ? styles.highlighted : styles.unHighlighted}
      ${mouseIsDown && styles.active}
    `
    return (
      <li
        className={rootClasses}
        onClick={this.handleClick}
        data-item-key={item.key}
        onMouseDown={this.handleMouseDown}
      >
        <div className={styles.icon}>{item.icon}</div>
        <div className={styles.title}>{item.title}</div>
        <div className={styles.content}>
          {item.content}
        </div>
      </li>
    )
  }
}
