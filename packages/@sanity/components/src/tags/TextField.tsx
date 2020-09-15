import React from 'react'

import styles from 'part:@sanity/components/tags/textfield-style'

interface TagsTextFieldProps {
  onChange: (value: string[]) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  readOnly?: boolean
  markers?: unknown[]
  value?: string[]
  inputId?: string
}

interface State {
  inputValue: string
}

function removeAt(array: string[], index: number) {
  const copy = array ? array.slice() : []
  copy.splice(index, 1)
  return copy
}

// @todo: refactor to functional component
export default class TagsTextField extends React.Component<
  TagsTextFieldProps & Omit<React.HTMLProps<HTMLInputElement>, 'onBlur' | 'onChange' | 'value'>,
  State
> {
  _input: HTMLInputElement | null = null

  state: State = {
    inputValue: ''
  }

  addTag(tagValue: string) {
    const {value = [], onChange} = this.props
    onChange(value.concat(tagValue))
  }

  removeTag(index: number) {
    const {value = [], onChange} = this.props
    onChange(removeAt(value, index))
  }

  addAndClearInput(tagValue: string) {
    this.addTag(tagValue)
    this.setState({inputValue: ''})
  }

  handleRemoveTagClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    this.removeTag(Number(event.currentTarget.getAttribute('data-index')))
  }

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const {value = []} = this.props
    const {inputValue} = this.state

    if (event.key === 'Backspace' && inputValue === '') {
      this.removeTag(value.length - 1)
    }
  }

  handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const {inputValue} = this.state

    if (inputValue && event.key === 'Enter') {
      this.addAndClearInput(inputValue)
    }
  }

  handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const {inputValue} = this.state
    if (inputValue) {
      this.addAndClearInput(inputValue)
    }

    if (this.props.onBlur) {
      this.props.onBlur(event)
    }
  }

  handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({inputValue: event.currentTarget.value})
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (el: HTMLInputElement | null) => {
    this._input = el
  }

  render() {
    const {inputValue} = this.state

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {onChange, value = [], readOnly, markers, inputId, ...rest} = this.props

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
