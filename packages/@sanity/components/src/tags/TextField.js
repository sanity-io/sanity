import React, {PropTypes} from 'react'
import {uniqueId} from 'lodash'

import styles from 'part:@sanity/components/tags/textfield-style'
import DefaultFormField from 'part:@sanity/components/formfields/default'

export default class TagsTextField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    onAddTag: PropTypes.func.isRequired,
    onRemoveTag: PropTypes.func.isRequired,
    error: PropTypes.bool,
    hasFocus: PropTypes.bool,
    isClearable: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.string),
    description: PropTypes.string,
    level: PropTypes.number
  }

  static defaultProps = {
    tags: []
  }

  constructor(props, context) {
    super(props, context)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleSetFocus = this.handleSetFocus.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)

    this.state = {
      length: 4,
      hasFocus: this.props.hasFocus
    }
  }

  addTag(title) {
    this.props.onAddTag(title)
  }

  removeTag(i) {
    this.props.onRemoveTag(i)
  }

  handleKeyDown(event) {
    const value = this._input.value
    if (event.key === 'Backspace' && value === '') {
      this.removeTag(this.props.tags.length - 1)
    }

    // length is used for styling purpose
    this.setState({
      length: value.length > 3 ? value.length : 3
    })
  }

  handleKeyPress(event) {
    const value = this._input.value

    if (event.key === 'Enter') {
      if (value) {
        this.addTag(value)
      }
      this._input.value = ''
    }
  }

  handleSetFocus() {
    this._input.focus()
  }

  handleFocus() {
    this.setState({
      hasFocus: true
    })
  }

  handleBlur() {
    const value = this._input.value
    if (value) {
      this.addTag(value)
      this._input.value = ''
    }
    this.setState({
      hasFocus: false
    })
  }

  componentWillMount() {
    this._inputId = uniqueId('DefaultTextField')
  }

  render() {
    const {tags, label, description, level} = this.props
    const {hasFocus} = this.state
    const setInput = component => {
      this._input = component
    }
    return (
      <DefaultFormField
        className={`
          ${styles.root}
          ${hasFocus ? styles.isFocused : 'noFocus'}
        `}
        level={level}
        label={label}
        labelHtmlFor={this._inputId}
        description={description}
      >
        <div className={styles.wrapper}>
          <div className={`${styles.inner}`}>
            <div className={styles.content} onClick={this.handleSetFocus}>
              <ul className={styles.tags}>
                {
                  tags && tags.map((tag, i) => {
                    return (
                      <li key={i} className={styles.tag}>
                        {tag}
                        <a
                          onClick={this.removeTag.bind(this, i)} // eslint-disable-line react/jsx-no-bind
                          className={styles.clearTag}
                        >
                          ×
                        </a>
                      </li>
                    )
                  })
                }
              </ul>
              <input
                className={styles.input}
                onKeyDown={this.handleKeyDown}
                onKeyPress={this.handleKeyPress}
                style={{width: `${this.state.length * 0.8}em`}}
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}
                ref={setInput}
                id={this._inputId}
                autoComplete="off"
              />
            </div>
            <div className={styles.focusHelper} />
          </div>
        </div>
      </DefaultFormField>
    )
  }
}
