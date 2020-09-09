import PropTypes from 'prop-types'
import React from 'react'

import styles from 'part:@sanity/components/tags/textfield-style'

function removeAt(array, index) {
  const copy = array ? array.slice() : []
  copy.splice(index, 1)
  return copy
}

export default class TagsTextField extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    readOnly: PropTypes.bool,
    markers: PropTypes.array,
    value: PropTypes.arrayOf(PropTypes.string),
    inputId: PropTypes.string
  }

  static defaultProps = {
    value: [],
    readOnly: false,
    onBlur: () => {}
  }

  state = {
    inputValue: ''
  }

  addTag(tagValue) {
    const {value, onChange} = this.props
    onChange((value || []).concat(tagValue))
  }

  removeTag(index) {
    const {value, onChange} = this.props
    onChange(removeAt(value, index))
  }

  addAndClearInput(tagValue) {
    this.addTag(tagValue)
    // clear input value
    this.setState({
      inputValue: ''
    })
  }

  handleRemoveTagClick = event => {
    this.removeTag(Number(event.currentTarget.getAttribute('data-index')))
  }

  handleKeyDown = event => {
    const {value} = this.props
    const {inputValue} = this.state

    if (event.key === 'Backspace' && inputValue === '') {
      this.removeTag(value.length - 1)
    }
  }

  handleKeyPress = event => {
    const {inputValue} = this.state

    if (inputValue && event.key === 'Enter') {
      this.addAndClearInput(inputValue)
    }
  }

  handleBlur = event => {
    const {inputValue} = this.state
    if (inputValue) {
      this.addAndClearInput(inputValue)
    }
    this.props.onBlur(event)
  }

  handleInputChange = event => {
    this.setState({inputValue: event.currentTarget.value})
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
    const {inputValue} = this.state
    const {onChange, value, readOnly, markers, inputId, ...rest} = this.props

    return (
      <div className={readOnly ? styles.rootReadOnly : styles.root}>
        <div className={styles.inner}>
          <div className={styles.content}>
            <ul className={styles.tags}>
              {value.map((tag, i) => {
                return (
                  <li key={i} className={readOnly ? styles.tag : styles.tagWithClear}>
                    {tag}
                    {!readOnly && (
                      <a
                        onClick={this.handleRemoveTagClick}
                        data-index={i}
                        className={styles.clearTag}
                      >
                        ×
                      </a>
                    )}
                  </li>
                )
              })}
              <input
                {...rest}
                readOnly={readOnly}
                value={inputValue}
                className={styles.input}
                onKeyDown={this.handleKeyDown}
                onKeyPress={this.handleKeyPress}
                onChange={this.handleInputChange}
                onBlur={this.handleBlur}
                ref={this.setInput}
                autoComplete="off"
                id={inputId}
              />
            </ul>
          </div>
          <div className={styles.focusHelper} />
        </div>
      </div>
    )
  }
}
