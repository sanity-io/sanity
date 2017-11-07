import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/PopOver.css'
import CloseIcon from 'part:@sanity/base/close-icon'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'

const PADDING = 20

export default class PopOver extends React.Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    color: PropTypes.oneOf(['default', 'danger', 'success', 'warning', 'info']),
    useOverlay: PropTypes.bool
  }

  static defaultProps = {
    color: 'default',
    onClose() {}, // eslint-disable-line
    isOpen: true,
    useOverlay: true
  }

  state = {
    arrowLeft: 0,
    popoverLeft: 0
  }

  handleClose = () => {
    this.props.onClose()
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
      onClose,
      color,
      useOverlay
    } = this.props


    const {
      popoverLeft,
      arrowLeft,
      availableHeight,
    } = this.state

    return (
      <div style={{display: 'span'}} ref={this.setRootElement}>
        <StickyPortal
          isOpen={isOpen}
          onResize={this.handlePortalResize}
          useOverlay={useOverlay}
        >
          <Stacked>
            {isActive => (
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
                <Escapable onEscape={event => ((isActive || event.shiftKey) && onClose())} />
                <CaptureOutsideClicks onClickOutside={isActive ? onClose : null}>
                  <div
                    className={styles.popover}
                    style={{
                      left: `${popoverLeft}px`
                    }}
                  >
                    <button className={styles.close} type="button" onClick={onClose}>
                      <CloseIcon />
                    </button>

                    <div
                      ref={this.setContentElement}
                      className={styles.content}
                      style={{
                        maxHeight: `${availableHeight - PADDING}px`
                      }}
                    >
                      {children}
                    </div>
                  </div>
                </CaptureOutsideClicks>
              </div>
            )}
          </Stacked>
        </StickyPortal>
      </div>
    )
  }
}
