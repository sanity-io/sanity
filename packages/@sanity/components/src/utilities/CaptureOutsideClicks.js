import React from 'react'
import PropTypes from 'prop-types'

export default class CaptureOutsideClicks extends React.Component {
  static propTypes = {
    onClickOutside: PropTypes.func,
    wrapperElement: PropTypes.string
  }
  static defaultProps = {
    wrapperElement: 'div'
  }

  componentWillMount() {
    document.addEventListener('mouseup', this.handleDocumentClick)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleDocumentClick)
  }

  handleDocumentClick = event => {
    if (this.props.onClickOutside && this._wrapperElement && !this._wrapperElement.contains(event.target)) {
      this.props.onClickOutside(event)
    }
  }

  setWrapperElement = element => {
    this._wrapperElement = element
  }

  render() {
    const {wrapperElement, onClickOutside, ...rest} = this.props
    return React.createElement(wrapperElement, {
      ...rest,
      ref: this.setWrapperElement
    })
  }
}
