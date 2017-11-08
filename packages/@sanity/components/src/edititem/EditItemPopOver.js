import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'

const PADDING = 10

export default class EditItemPopOver extends React.PureComponent {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    actions: PropTypes.arrayOf(PropTypes.shape({
      kind: PropTypes.string,
      title: PropTypes.string,
      key: PropTypes.string,
      handleClick: PropTypes.func
    })),
    isOpen: PropTypes.bool
  }

  static defaultProps = {
    title: undefined,
    onClose() {},
    actions: [],
    isOpen: true
  }
  lastY = 0
  state = {
    arrowLeft: 0,
    popoverLeft: 0,
    isResizing: false
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
      availableWidth,
      isScrolling
    } = dimensions

    const width = this._popOverInnerElement.offsetWidth

    let popoverLeft = rootLeft - (width / 2)

    if (availableWidth < (rootLeft + (width / 2))) {
      popoverLeft = availableWidth - width - PADDING
    }

    this.setState({
      popoverLeft: popoverLeft,
      maxHeight: availableHeight,
      arrowLeft: rootLeft,
      isResizing: isScrolling,
      wantedHeight: this._contentElement.scrollHeight
    })
  }

  render() {
    const {
      title,
      children,
      actions,
      onClose,
      isOpen,
    } = this.props

    const {
      popoverLeft,
      arrowLeft,
      maxHeight,
      isResizing,
      wantedHeight
    } = this.state

    return (
      <div style={{display: 'span'}} ref={this.setRootElement}>
        <StickyPortal
          isOpen={isOpen}
          onResize={this.handlePortalResize}
          stickToTop
          wantedHeight={wantedHeight}
        >
          <Stacked>
            {isActive => (
              <div
                ref={this.setPopoverInnerElement}
                className={styles.root}
              >
                <div
                  className={title ? styles.filledArrow : styles.arrow}
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
                  <button className={title ? styles.closeInverted : styles.close} type="button" onClick={onClose}>
                    <CloseIcon />
                  </button>

                  {
                    title && (
                      <h3 className={styles.title}>
                        {title}
                      </h3>
                    )
                  }
                  <Escapable onEscape={event => ((isActive || event.shiftKey) && onClose())} />
                  <CaptureOutsideClicks onClickOutside={isActive ? onClose : null}>
                    <div
                      ref={this.setContentElement}
                      className={isResizing ? styles.contentIsResizing : styles.content}
                      style={{
                        maxHeight: `${maxHeight}px`
                      }}
                    >
                      {children}
                    </div>
                    {
                      actions.length > 0 && (
                        <div className={styles.functions}>
                          {
                            actions.map(action => {
                              return (
                                <Button
                                  key={action.key}
                                  onClick={action.handleClick}
                                  kind={action.kind}
                                  className={styles[`button_${action.kind}`] || styles.button}
                                >
                                  {action.title}
                                </Button>
                              )
                            })
                          }
                        </div>
                      )
                    }
                  </CaptureOutsideClicks>
                </div>
              </div>
            )}
          </Stacked>
        </StickyPortal>
      </div>
    )
  }
}
