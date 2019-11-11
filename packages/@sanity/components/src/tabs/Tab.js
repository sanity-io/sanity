import PropTypes from 'prop-types'
import React from 'react'

import styles from './Tab.css'

export default class Tab extends React.PureComponent {
  static propTypes = {
    'aria-controls': PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    icon: PropTypes.func,
    isActive: PropTypes.bool,
    isFocused: PropTypes.bool,
    label: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func
  }

  static defaultProps = {
    icon: undefined,
    isActive: false,
    isFocused: false,
    onFocus: undefined
  }

  // reference to root element
  element = null

  constructor(props) {
    super(props)
    this.state = {isDOMFocused: false}
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isFocused && this.props.isFocused) {
      if (!this.state.isDOMFocused) {
        this.focusTimeout = setTimeout(() => {
          this.element.focus()
        }, 0)
      }
    }
  }

  componentWillUnmount() {
    clearTimeout(this.focusTimeout)
  }

  handleBlur = () => {
    this.setState({isDOMFocused: false})
  }

  handleFocus = () => {
    this.setState({isDOMFocused: true})
    if (this.props.onFocus) {
      this.props.onFocus()
    }
  }

  setElement = element => {
    this.element = element
  }

  render() {
    const {id, isActive, label, onClick, icon} = this.props

    return (
      <button
        aria-controls={this.props['aria-controls']}
        aria-selected={isActive ? 'true' : 'false'}
        className={isActive ? styles.isActive : styles.root}
        id={id}
        onClick={onClick}
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        ref={this.setElement}
        role="tab"
        tabIndex={isActive ? 0 : -1}
        type="button"
      >
        <div tabIndex={-1}>
          {icon && <span className={styles.icon}>{React.createElement(icon)}</span>}{' '}
          <span className={styles.label}>{label}</span>
        </div>
      </button>
    )
  }
}
