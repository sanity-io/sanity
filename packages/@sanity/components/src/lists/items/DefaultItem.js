import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/lists/items/default-style'
import {StateLink} from 'part:@sanity/base/router'

export default class DefaultListItem extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    item: PropTypes.object.isRequired,
    focus: PropTypes.bool,
    onSelect: PropTypes.func,
    onOpen: PropTypes.func,
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

  handleDoubleClick = event => {
    this.props.onOpen(this.props.item)
  }

  componentDidMount() {
    this.ensureVisible()
  }

  componentDidUpdate() {
    this.ensureVisible()
  }

  componentWillUpdate(nextProps) {
    if (nextProps.focus && !this.props.focus) {
      this._focusableElement.focus()
    }
  }

  setElement = element => {
    this._element = element
  }

  setFocusableElement = element => {
    this._focusableElement = element
  }

  ensureVisible() {
    const {selected, scrollIntoView, highlighted} = this.props

    if ((selected || highlighted) && scrollIntoView) {
      // TODO fix this
      // Hack because the ref in defaultlist is called after this
      setTimeout(() => {
        scrollIntoView(this._element)
      }, 0)
    }
  }

  handleKeyPress = event => {
    if (event.key == 'Enter') {
      this.props.onSelect(this.props.item)
    }
  }

  render() {
    const {selected, highlighted, className, decoration, item} = this.props
    const rootClasses = `
      ${styles.root}
      ${decoration ? styles[decoration] : ''}
      ${highlighted ? styles.highlighted : ''}
      ${selected ? styles.selected : ''}
      ${className}
    `
    return (
      <li className={rootClasses} ref={this.setElement}>
        {
          item.stateLink && (
            <StateLink
              tabIndex="0"
              className={styles.link}
              onClick={this.handleClick}
              state={item.stateLink}
              onDoubleClick={this.handleDoubleClick}
              ref={this.setFocusableElement}
            >
              {this.props.children}
            </StateLink>
          )
        }
        {
          !item.stateLink && (
            <div
              tabIndex="0"
              className={styles.noLink}
              onClick={this.handleClick}
              onDoubleClick={this.handleDoubleClick}
              onKeyPress={this.handleKeyPress}
              ref={this.setFocusableElement}
            >
              {this.props.children}
            </div>
          )
        }
      </li>
    )
  }
}
