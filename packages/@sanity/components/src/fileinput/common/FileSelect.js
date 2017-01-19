import React, {PropTypes} from 'react'
import {omit, uniqueId} from 'lodash'

export default class FileSelect extends React.PureComponent {
  static propTypes = {
    onSelect: PropTypes.func
  }
  static defaultProps = {
    onSelect() {}
  }
  componentWillMount() {
    this._inputId = uniqueId('FileSelect')
  }
  componentDidMount() {
    if ('value' in this.props) {
      // eslint-disable-next-line
      console.error(new Error(
        'Warning: A `value` prop was passed to FileSelect. This is most likely not intended as this'
        + ' component is only for letting users select file(s) from their hard drive'
      ))
    }
  }

  handleSelect = event => {
    this.props.onSelect(event.target.files)
  }

  render() {
    const {children, style = {}, className, ...rest} = omit(this.props, 'onSelect')
    return (
      <label
        style={style}
        className={className}
        htmlFor={this._inputId}
      >
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
