import React from 'react'

interface CaptureOutsideClicksProps extends React.HTMLProps<HTMLDivElement> {
  onClickOutside?: (event: MouseEvent) => void
  wrapperElement?: string
}

// @todo: refactor to functional component
export default class CaptureOutsideClicks extends React.Component<CaptureOutsideClicksProps> {
  hadMouseDown = false

  _wrapperElement: HTMLDivElement | null = null

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    document.addEventListener('mouseup', this.handleDocumentClick)
    document.addEventListener('mousedown', this.handleMouseDown)
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.handleDocumentClick)
    document.removeEventListener('mousedown', this.handleMouseDown)
  }

  handleMouseDown = (event: MouseEvent) => {
    if (this._wrapperElement && this._wrapperElement.contains(event.target as Node)) {
      this.hadMouseDown = true
    }
  }

  handleDocumentClick = (event: MouseEvent) => {
    if (
      this.props.onClickOutside &&
      this._wrapperElement &&
      event.target instanceof Node &&
      !this._wrapperElement.contains(event.target) &&
      !this.hadMouseDown
    ) {
      this.props.onClickOutside(event)
    }
    this.hadMouseDown = false
  }

  setWrapperElement = (element: HTMLDivElement | null) => {
    this._wrapperElement = element
  }

  render() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {wrapperElement = 'div', onClickOutside: _, ...restProps} = this.props

    return React.createElement(wrapperElement, {
      ...restProps,
      ref: this.setWrapperElement
    })
  }
}
