import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/textareas/default-style'
import IoAndroidClose from 'part:@sanity/base/close-icon'

export default class DefaultTextArea extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyPress: PropTypes.func,
    onBlur: PropTypes.func,
    onClear: PropTypes.func,
    value: PropTypes.string,
    error: PropTypes.bool,
    placeholder: PropTypes.string,
    isClearable: PropTypes.bool,
    rows: PropTypes.number,
    id: PropTypes.string.isRequired,
    focus: PropTypes.bool
  }

  static defaultProps = {
    value: '',
    type: 'text',
    rows: 10,
    onKeyPress() {},
    onChange() {},
    onFocus() {},
    onClear() {},
    onBlur() {}
  }

  handleClear = event => {
    this.props.onClear(event)
  }

  render() {
    const {value, placeholder, error, isClearable, id, rows, onKeyPress, onChange, onFocus, onBlur, focus} = this.props

    return (
      <div
        className={`
          ${error ? styles.error : styles.root}
          ${focus ? styles.hasFocus : ''}
        `}
      >
        <textarea
          className={`
            ${styles.textarea}
            ${error ? styles.inputError : styles.input}
            ${isClearable ? styles.hasClearButton : ''}
          `}
          rows={rows}
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          onKeyPress={onKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
        />
        <div className={styles.focusHelper} />
        {
          isClearable && <button className={styles.clearButton} onClick={this.handleClear}><IoAndroidClose color="inherit" /></button>
        }
      </div>
    )
  }
}
