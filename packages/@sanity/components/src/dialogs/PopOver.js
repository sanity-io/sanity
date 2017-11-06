import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/PopOver.css'
import CloseIcon from 'part:@sanity/base/close-icon'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import tryFindScrollContainer from '../utilities/tryFindScrollContainer'

const PADDING = 5

export default class EditItemPopOver extends React.Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    color: PropTypes.oneOf(['default', 'danger', 'success', 'warning', 'info']),
    scrollContainer: PropTypes.object,
    onClickOutside: PropTypes.func,
    useOverlay: PropTypes.bool
  }

  static defaultProps = {
    color: 'default',
    scrollContainer: undefined,
    onClose() {}, // eslint-disable-line
    onClickOutside() {},
    isOpen: true,
    useOverlay: true
  }

  state = {
    arrowLeft: 0,
    popoverLeft: 0,
    scrollContainer: undefined,
    isResizing: false
  }

  componentDidMount() {
    const {
      scrollContainer
    } = this.props

    if (!this._rootElement) {
      // console.error('no root element')
    }

    if (scrollContainer) {
      this.setScrollContainerElement(scrollContainer)
    } else {
      this.setScrollContainerElement(tryFindScrollContainer(this._rootElement))
    }
  }

  setScrollContainerElement = element => {
    this.setState({
      scrollContainer: element
    })
  }

  handleClose = () => {
    this.props.onClose()
  }

  handleKeyDown = event => {
    if (event.key == 'Escape') {
      this.handleClose()
    }
  }

  setArrowElement = element => {
    this._arrowElement = element
  }

  setContentElement = element => {
    this._contentElement = element
  }

  setPopoverInnerElement = element => {
    this._popOverInnerElement = element
  }

  setRootElement = element => {
    this._rootElement = element
  }

  handlePortalResize = dimensions => {
    if (!this._popOverInnerElement) {
      return
    }

    const {
      rootLeft,
      availableHeight,
      availableWidth
    } = dimensions

    const width = this._popOverInnerElement.offsetWidth

    let popoverLeft = rootLeft - (width / 2)

    if (availableWidth < (rootLeft + (width / 2))) {
      popoverLeft = availableWidth - width - PADDING
    }

    this.setState({
      popoverLeft: popoverLeft,
      availableHeight: availableHeight,
      arrowLeft: rootLeft
    })
  }

  render() {
    const {
      children,
      isOpen,
      color,
      useOverlay
    } = this.props


    const {
      popoverLeft,
      arrowLeft,
      availableHeight,
      scrollContainer,
    } = this.state

    return (
      <div style={{display: 'span'}} ref={this.setRootElement}>
        <StickyPortal
          isOpen={isOpen}
          scrollContainer={scrollContainer}
          onClickOutside={this.props.onClickOutside}
          onResize={this.handlePortalResize}
          onClick={this.handleClick}
          useOverlay={useOverlay}
          onClose={this.handleClose}
        >
          <div
            ref={this.setPopoverInnerElement}
            className={`
              ${styles.root}
              ${color === 'danger' ? styles.colorDanger : ''}
              ${color === 'warning' ? styles.colorWarning : ''}
              ${color === 'info' ? styles.colorInfo : ''}
              ${color === 'success' ? styles.colorSuccess : ''}
            `}
          >
            <div
              className={styles.arrow}
              ref={this.setArrowElement}
              style={{
                left: `${arrowLeft}px`
              }}
            />
            <div
              className={styles.popover}
              style={{
                left: `${popoverLeft}px`
              }}
            >
              <button className={styles.close} type="button" onClick={this.handleClose}>
                <CloseIcon />
              </button>

              <div
                ref={this.setContentElement}
                className={styles.content}
                style={{
                  maxHeight: `${availableHeight - 16}px`
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </StickyPortal>
      </div>
    )
  }
}
