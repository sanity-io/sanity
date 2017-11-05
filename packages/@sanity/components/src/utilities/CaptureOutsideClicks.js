import React from 'react'
import PropTypes from 'prop-types'

export default class CaptureOutsideClicks extends React.Component {
  static propTypes = {
    onClickOutside: PropTypes.func.isRequired,
    wrapperElement: PropTypes.string
  }
  static defaultProps = {
    wrapperElement: 'div'
  }

  componentWillMount() {
    document.addEventListener('click', this.handleDocumentClick)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick)
  }

  handleDocumentClick = event => {
    if (this._wrapperElement && !this._wrapperElement.contains(event.target)) {
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
