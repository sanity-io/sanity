import classNames from 'classnames'
import React from 'react'
import {uniqueId} from 'lodash'

import styles from './DefaultFileInput.css'

interface DefaultFileInputProps {
  onSelect?: (files: FileList | null) => void
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

// @todo: refactor to functional component
export default class DefaultFileInput extends React.PureComponent<DefaultFileInputProps> {
  _inputId = uniqueId('FileSelect')
  componentDidMount() {
    if ('value' in this.props) {
      // eslint-disable-next-line
      console.error(
        new Error(
          'Warning: A `value` prop was passed to FileSelect. This is most likely not intended as this' +
            ' component is only for letting users select file(s) from their hard drive'
        )
      )
    }
  }

  handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (this.props.onSelect) {
      this.props.onSelect(event.target.files)
    }
  }

  render() {
    const {children, style = {}, className, onSelect, ...rest} = this.props
    return (
      <label style={style} className={classNames(styles.root, className)} htmlFor={this._inputId}>
        <input
          {...rest}
          type="file"
          value=""
          id={this._inputId}
          onChange={this.handleSelect}
          style={{
            overflow: 'hidden',
            width: '0.1px',
            height: '0.1px',
            opacity: 0,
            position: 'absolute',
            zIndex: -1
          }}
        />
        {children}
      </label>
    )
  }
}
