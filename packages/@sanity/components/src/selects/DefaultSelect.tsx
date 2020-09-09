import React from 'react'
import styles from 'part:@sanity/components/selects/default-style'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'

interface Item {
  title: string
}

interface DefaultSelectProps {
  onChange: (item: Item) => void
  value: Item
  hasError: boolean
  onFocus: () => void
  onBlur: () => void
  hasFocus: boolean
  disabled: boolean
  readOnly: boolean
  items: Item[]
}

export default class DefaultSelect extends React.Component<
  DefaultSelectProps & Omit<React.HTMLProps<HTMLSelectElement>, 'value'>
> {
  static defaultProps = {
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    readOnly: false,
    hasError: false,
    hasFocus: false,
    value: {},
    items: []
  }

  _input: any

  handleChange = (event: any) => {
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
            <FaAngleDown />
          </span>
        </div>
      </div>
    )
  }
}
