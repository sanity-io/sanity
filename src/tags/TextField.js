import React, {PropTypes} from 'react'

import styles from 'style:@sanity/components/tags/textfield'

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
    console.log('New tag', title)
    this.props.addTag(title)
  }

  removeTag(i) {
    console.log('Remove tag', i)
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
      this.addTag(value)
      this._input.value = ''
    }
  }

  handleSetFocus() {
    this._input.focus()
  }

  handleFocus() {
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
    console.log('render', tags)
    return (
      <div className={`${styles.root} ${this.state.isFocused ? styles.isFocused : 'noFocus'}`}>
        <label className={styles.label}>{label}</label>
        <div className={`${styles.inner}`}>
          <div className={styles.content} onClick={this.handleSetFocus}>
            <ul className={styles.tags}>
              {
                tags && tags.map((tag, i) => {
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
