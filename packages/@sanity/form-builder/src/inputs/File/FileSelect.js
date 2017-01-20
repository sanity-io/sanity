import React, {PropTypes} from 'react'
import {omit} from 'lodash'

export default class FileSelect extends React.PureComponent {
  static propTypes = {
    onSelect: PropTypes.func
  }
  static defaultProps = {
    onSelect() {}
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
      >
        <input
          {...rest}
          type="file"
          value=""
          onChange={this.handleSelect}
          style={{
            width: 0.1,
            height: 0.1,
            opacity: 0,
            overflow: 'hidden',
            position: 'absolute',
            zIndex: -1
          }}
        />
        {children}
      </label>
    )
  }
}
