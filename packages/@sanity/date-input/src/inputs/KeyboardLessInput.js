import PropTypes from 'prop-types'
import React from 'react'
import styles from './Date.css'

/**
 * The purpose of this custom input is to prevent keyboard shortcuts for
 * navigating dates, since it was deemed more annoying than useful at this
 * stage. In the future, we should probably try to see if we can pass a
 * prop to customize this behaviour on a per-field basis
 */
class KeyboardLessInput extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onKeyDown: PropTypes.func,
    value: PropTypes.string
  };

  constructor(props) {
    super(props)

    this.assignRef = this.assignRef.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
  }

  focus() {
    this.textInput.focus()
  }

  handleKeyDown(event) {
    if (event.key === 'Tab' || event.key === 'Escape') {
      this.props.onKeyDown(event)
    }
  }

  assignRef(input) {
    this.textInput = input
  }

  render() {
    return (
      <input
        type="text"
        ref={this.assignRef}
        className={styles.datepicker}
        onKeyDown={this.handleKeyDown}
        onClick={this.props.onClick}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
        onChange={this.props.onChange}
        value={this.props.value}
      />
    )
  }
}

export default KeyboardLessInput
