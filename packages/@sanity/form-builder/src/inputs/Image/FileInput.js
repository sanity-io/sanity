import PropTypes from 'prop-types'
import React from 'react'
import {uniqueId} from 'lodash'

const INPUT_STYLE = {
  overflow: 'hidden',
  width: '0.1px',
  height: '0.1px',
  opacity: 0,
  position: 'absolute',
  zIndex: -1
}

export default class FileInput extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
  }
  _inputId = uniqueId('FileSelect')

  componentDidMount() {
    if ('value' in this.props) {
      // eslint-disable-next-line
      console.error(new Error(
        'Warning: A `value` prop was passed to FileSelect. This is most likely not intended as this'
        + ' component is only for letting users select file(s) from their hard drive'
      ))
    }
  }

  render() {
    const {children, className, ...rest} = this.props
    return (
      <label
        className={className}
        htmlFor={this._inputId}
      >
        <input
          {...rest}
          type="file"
          value=""
          id={this._inputId}
          style={INPUT_STYLE}
        />
        {children}
      </label>
    )
  }
}
