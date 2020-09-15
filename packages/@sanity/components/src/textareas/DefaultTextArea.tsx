import React from 'react'
import IoAndroidClose from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/textareas/default-style'

interface DefaultTextAreaProps {
  onClear?: (event?: unknown) => void
  customValidity?: string
  isClearable?: boolean
  hasFocus?: boolean
  inputId?: string
}

// @todo: refactor to functional component
export default class DefaultTextArea extends React.Component<
  DefaultTextAreaProps & Omit<React.HTMLProps<HTMLTextAreaElement>, 'id'>
> {
  _input: HTMLTextAreaElement | null = null

  handleClear = (event: unknown) => {
    if (this.props.onClear) {
      this.props.onClear(event)
    }
  }

  select() {
    if (this._input) {
      this._input.select()
    }
  }

  focus() {
    if (this._input) {
      this._input.focus()
    }
  }

  setInput = (element: HTMLTextAreaElement | null) => {
    this._input = element
  }

  componentDidMount() {
    if (this._input) {
      this._input.setCustomValidity(this.props.customValidity || '')
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: DefaultTextAreaProps) {
    if (this._input) {
      if (nextProps.customValidity !== this.props.customValidity) {
        this._input.setCustomValidity(nextProps.customValidity || '')
      }
    }
  }

  render() {
    const {
      isClearable,
      onClear,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      customValidity = '',
      inputId,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      hasFocus,
      rows = 10,
      ...rest
    } = this.props

    return (
      <div className={styles.root}>
        <textarea
          id={inputId}
          className={styles.textarea}
          autoComplete="off"
          ref={this.setInput}
          rows={rows}
          {...rest}
        />

        {isClearable && !this.props.disabled && (
          <button type="button" className={styles.clearButton} onClick={onClear}>
            <IoAndroidClose />
          </button>
        )}
      </div>
    )
  }
}
