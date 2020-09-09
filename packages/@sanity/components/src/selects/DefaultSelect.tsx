import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/default-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'

export default class DefaultSelect extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.object,
    hasError: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    hasFocus: PropTypes.bool,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    )
  }

  static defaultProps = {
    onChange() {},
    onBlur() {},
    onFocus() {},
    readOnly: false,
    hasError: false,
    hasFocus: false,
    value: {},
    items: []
  }

  handleChange = event => {
    this.props.onChange(this.props.items[event.target.value])
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = el => {
    this._input = el
  }

  render() {
    const {hasError, items, value, disabled, hasFocus, readOnly, ...rest} = this.props
    return (
      <div
        className={`
          ${disabled || readOnly ? styles.disabled : ''}
          ${hasFocus ? styles.hasFocus : styles.root}
        `}
      >
        <select
          {...rest}
          className={`${styles.select} ${hasError ? styles.invalid : ''}`}
          onChange={this.handleChange}
          disabled={disabled || readOnly}
          value={(value && items.indexOf(value)) || ''}
          autoComplete="off"
          ref={this.setInput}
        >
          {!value && <option />}
          {items.length &&
            items.map((item, i) => {
              return (
                <option key={i} value={i}>
                  {item.title}
                </option>
              )
            })}
        </select>
        <div className={styles.functions}>
          <span className={styles.arrow}>
            <FaAngleDown color="inherit" />
          </span>
        </div>
      </div>
    )
  }
}
