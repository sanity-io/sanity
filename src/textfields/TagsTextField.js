import React, {PropTypes} from 'react'

import DefaultTextField from 'component:@sanity/components/textfields/default'
import styles from 'style:@sanity/components/textfields/tags'

export default class TagsTextField extends React.Component {
  static propTypes = {
    label: PropTypes.func.isRequired,
    onChange: PropTypes.func,
    error: PropTypes.bool,
    onKeyPress: PropTypes.func,
    placeholder: PropTypes.string,
    focus: PropTypes.func,
    showClearButton: PropTypes.bool,
    tags: PropTypes.arr
  }

  static defaultProps = {
    value: '',
    tags: [],
    onKeyPress() {}
  }

  constructor(props, context) {
    super(props, context)
    this.handleKeyPress = this.handleKeyPress.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleSetFocus = this.handleSetFocus.bind(this)
    this.handleFocus = this.handleFocus.bind(this)
    this.handleBlur = this.handleBlur.bind(this)

    // this.handleChange = this.handleChange.bind(this)
    this.state = {
      length: 4,
      isFocused: false
    }
  }

  handleChange() {
    // this.props.onChange()
  }

  addTag(title) {
    console.log('new tag')
  }

  removeTag(i) {
    this.props.removeTag(i)
  }

  handleKeyDown(event) {
    const value = this._input.value
    if (event.key == 'Backspace' && value == '') {
      this.removeTag(this.props.tags.length)
    }
    this.setState({
      length: value.length > 3 ? value.length : 3
    })
  }

  handleKeyPress(event) {
    const value = this._input.value

    if (event.key == 'Enter') {
      console.log('Create tag')
      this.props.addTag(value)
      this._input.value = ''
    }
  }

  handleSetFocus() {
    console.log('setting focus')
    console.log('_input', this._input)
    this._input.focus()
  }

  handleFocus() {
    console.log('handleFocus')
    this.setState({
      isFocused: true
    })
  }

  handleBlur() {
    this.setState({
      isFocused: false
    })
  }

  render() {
    const {tags, label} = this.props
    return (
      <div className={`${styles.root} ${this.state.isFocused ? styles.isFocused : 'noFocus'}`}>
        <label className={styles.label}>{label}</label>
        <div className={`${styles.inner}`}>
          <div className={styles.content} onClick={this.handleSetFocus}>
            <ul className={styles.tags}>
              {
                tags.map((tag, i) => {
                  return (
                    <li key={i} className={styles.tag}>
                      {tag}
                      <a
                        onClick={this.removeTag.bind(this, i)}
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
              ref={(c) => this._input = c}
            />
          </div>
        </div>
      </div>
    )
  }
}
