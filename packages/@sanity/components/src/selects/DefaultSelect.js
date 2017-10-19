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
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
      })
    ),
  }

  static defaultProps = {
    onChange() {},
    onBlur() {},
    onFocus() {},
    hasError: false,
    hasFocus: false,
    value: {},
    items: []
  }

  handleChange = event => {
    this.props.onChange(this.props.items[event.target.value])
  }

  render() {
    const {hasError, items, value, onFocus, onBlur, hasFocus, disabled, ...rest} = this.props
    return (
      <div
        className={`
        ${disabled ? styles.selectContainerDisabled : styles.selectContainer}
        ${hasFocus ? styles.hasFocus : ''}
        ${hasError ? styles.hasError : ''}
      `}
      >
        <select
          className={styles.select}
          onChange={this.handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          value={value && items.indexOf(value)}
          autoComplete="off"
          disabled={disabled}
          {...rest}
        >
          {!value && <option />}
          {
            items && items.length > 0 && items.map((item, i) => {
              return (
                <option key={i} value={i}>{item.title}</option>
              )
            })
          }
        </select>
        <div className={styles.focusHelper} />
        <div className={styles.icon}>
          <FaAngleDown color="inherit" />
        </div>
      </div>
    )
  }
}
