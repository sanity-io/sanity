import React, {PropTypes} from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import classNames from 'classnames'
const NOOP = () => {}

export default class DefaultTextInput extends React.PureComponent {
  static propTypes = {
    value: PropTypes.string,
    type: PropTypes.string,
    onClear: PropTypes.func,
    isClearable: PropTypes.bool,
    hasFocus: PropTypes.bool,
    isSelected: PropTypes.bool,
    isDisabled: PropTypes.bool,
    hasError: PropTypes.bool,
    styles: PropTypes.shape({
      container: PropTypes.string,
      input: PropTypes.string,
      isClearable: PropTypes.string,
      focusHelper: PropTypes.string,
      clearButton: PropTypes.string,
      inputOnDisabled: PropTypes.string,
      inputOnError: PropTypes.string,
      containerOnError: PropTypes.string,
    })
  }

  static defaultProps = {
    value: '',
    type: 'text',
    isSelected: false,
    hasError: false,
    isClearable: false,
    isDisabled: false,
    hasFocus: false,
    autoComplete: 'off',
    onClear: NOOP,
    styles: {}
  }

  componentDidMount() {
    const {hasFocus, isSelected} = this.props
    this.setFocused(hasFocus)
    this.setSelected(isSelected)
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isSelected !== this.props.isSelected) {
      this.setSelected(this.props.isSelected)
    }
    if (prevProps.hasFocus !== this.props.hasFocus) {
      this.setFocused(this.props.hasFocus)
    }
  }

  select = () => {
    this._input.select()
  }

  focus = () => {
    this._input.focus()
  }

  setSelected(isSelected) {
    if (isSelected) {
      this.select()
    }
  }

  setFocused(hasFocus) {
    if (hasFocus) {
      this.focus()
    }
  }

  setInputElement = element => {
    this._input = element
  }

  render() {
    const {
      onClear,
      hasError,
      isClearable,
      hasFocus,
      isDisabled,
      styles,
      ...rest
    } = this.props

    return (
      <div
        className={classNames(styles.container, [
          hasError && styles.containerOnError,
          isClearable && styles.isClearable,
          isDisabled && styles.isDisabled,
          hasFocus && styles.hasFocus,
        ])}
      >
        <input
          ref={this.setInputElement}
          {...rest}
          className={classNames(styles.input, [
            hasError && styles.inputOnError,
            isDisabled && styles.isDisabled,
            hasFocus && styles.hasFocus,
          ])}
          disabled={isDisabled}
        />
        <div className={styles.focusHelper} />
        {isClearable && (
          <button className={styles.clearButton} onClick={onClear}>
            <CloseIcon color="inherit" />
          </button>
        )}
      </div>
    )
  }
}
