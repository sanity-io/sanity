import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/default-style'
import {uniqueId} from 'lodash'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import FormField from 'part:@sanity/components/formfields/default'

export default class DefaultSelect extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.object,
    error: PropTypes.bool,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    hasFocus: PropTypes.bool,
    isClearable: PropTypes.bool,
    level: PropTypes.number,
    hasFocus: PropTypes.bool,
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
    hasFocus: false
  }

  // componentWillReceiveProps(nextProps) {
  //   if (nextProps.focus != this.props.focus) {
  //     this.props.onFocus()
  //   }
  // }

  handleChange = event => {
    this.props.onChange(this.props.items[event.target.value])
  }

  componentWillMount() {
    this._inputId = uniqueId('DefaultSelect')
  }

  render() {
    const {label, error, items, value, level, onFocus, onBlur, hasFocus} = this.props
    return (
      <FormField
        className={`
          ${error ? styles.error : styles.root}
          ${hasFocus ? styles.hasFocus : ''}`
        }
        label={label}
        labelHtmlFor={this._inputId || ''}
        level={level}
      >
        <div className={styles.selectContainer}>
          <select
            className={styles.select}
            id={this._inputId}
            onChange={this.handleChange}
            onFocus={onFocus}
            onBlur={onBlur}
            value={value && items.indexOf(value)}
            autoComplete="off"
          >
            {!value && <option />}
            {
              items.map((item, i) => {
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
      </FormField>
    )
  }
}
