import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/radiobutton/default-style'
import {uniqueId} from 'lodash'

export default class RadioButton extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    item: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    checked: PropTypes.bool,
    disabled: PropTypes.bool,
    name: PropTypes.string
  }

  state = {
    isFocused: false,
    justChanged: false
  }

  static defaultProps = {
    onChange() {}
  }

  componentWillMount() {
    this._inputId = uniqueId('RadioSelect')
  }

  handleChange = () => {
    this.props.onChange(this.props.item)
    this.setState({
      justChanged: true
    })
  }

  handleFocus = () => {
    this.setState({
      isFocused: true,
      justChanged: false
    })
  }

  handleBlur = () => {
    this.setState({
      isFocused: false,
      justChanged: false
    })
  }


  render() {
    const {disabled, checked, label, name} = this.props
    const {isFocused} = this.state

    return (
      <label
        className={`
        ${styles.root}
        ${disabled ? styles.isDisabled : styles.isEnabled}
        ${checked ? styles.isChecked : styles.unChecked}
        ${isFocused ? styles.isFocused : ''}

        `}
      >
        <input
          className={styles.input}
          type="radio"
          onChange={this.handleChange}
          checked={checked}
          id={this._inputId}
          name={name}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
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
