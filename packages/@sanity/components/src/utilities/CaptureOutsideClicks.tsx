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

  hadMouseDown = false

  UNSAFE_componentWillMount() {
    document.addEventListener('mouseup', this.handleDocumentClick)
    document.addEventListener('mousedown', this.handleMouseDown)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleDocumentClick)
    document.removeEventListener('mousedown', this.handleMouseDown)
  }

  handleMouseDown = event => {
    if (this._wrapperElement.contains(event.target)) {
      this.hadMouseDown = true
    }
  }

  handleDocumentClick = event => {
    if (
      this.props.onClickOutside &&
      this._wrapperElement &&
      !this._wrapperElement.contains(event.target) &&
      !this.hadMouseDown
    ) {
      this.props.onClickOutside(event)
    }
    this.hadMouseDown = false
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
