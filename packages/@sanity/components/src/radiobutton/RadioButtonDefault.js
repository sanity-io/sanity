import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/radiobutton/default-style'
import {uniqueId} from 'lodash'

export default class RadioButton extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    name: PropTypes.string,
    focus: PropTypes.bool
  }

  static defaultProps = {
    onChange() {}
  }

  componentWillMount() {
    this._inputId = uniqueId('RadioSelect')
  }

  handleChange = () => {
    this.props.onChange(this.props.item)
  }

  render() {
    const {disabled, checked, label, name, onFocus, onBlur, focus} = this.props

    return (
      <label
        className={`
        ${styles.root}
        ${disabled ? styles.isDisabled : styles.isEnabled}
        ${checked ? styles.isChecked : styles.unChecked}
        ${focus ? styles.isFocused : ''}

        `}
      >
        <input
          className={styles.input}
          type="radio"
          onChange={this.handleChange}
          checked={checked}
          id={this._inputId}
          name={name}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
        />
        <div className={styles.label} htmlFor={this._inputId}>{label}</div>
        <div className={styles.circleOutline}>
          <div className={styles.tickOutline} />
        </div>
        <div className={styles.focusHelper} />
        <div className={styles.tickHelper} />
      </label>
    )
  }
}
