import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/selects/radio-style'
import RadioButton from 'part:@sanity/components/radiobutton/default'

export default class RadioSelect extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    direction: PropTypes.oneOf(['horizontal', 'vertical']),
    onChange: PropTypes.func,
    value: PropTypes.object,
    readOnly: PropTypes.bool,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string
      })
    )
  }

  static defaultProps = {
    onChange() {}
  }

  state = {
    focusedItem: null
  }

  handleRadioChange = item => {
    this.props.onChange(item)
  }

  handleFocus = item => {
    this.setState({
      focusedItem: item
    })
  }

  handleBlur = () => {
    this.setState({
      focusedItem: null
    })
  }

  focus() {
    // todo. See https://github.com/sanity-io/sanity/issues/527
  }

  render() {
    const {items, value, name, direction, readOnly} = this.props
    const {focusedItem} = this.state

    return (
      <div
        className={`
          ${direction == 'vertical' ? styles.vertical : styles.horizontal}
        `}
      >
        <div className={styles.radioContainer}>
          {items.map((item, i) => {
            return (
              <div className={styles.item} key={i}>
                <RadioButton
                  disabled={readOnly}
                  name={name}
                  label={item.title}
                  item={item}
                  onChange={this.handleRadioChange}
                  checked={value === item}
                  onFocus={this.handleFocus}
                  onBlur={this.handleBlur}
                  hasFocus={focusedItem === item}
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  }
}
