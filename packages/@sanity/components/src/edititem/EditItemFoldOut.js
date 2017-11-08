import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/fold-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import Stacked from '../utilities/Stacked'
import Escapable from '../utilities/Escapable'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'

export default class EditItemFoldOut extends React.PureComponent {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
  }

  static defaultProps = {
    title: '',
    onClose() {}, // eslint-disable-line
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  state = {
    left: 0,
    width: 500,
    height: 500
  }

  setRootElement = element => {
    this._rootElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  handleResize = dimensions => {
    this.setState({
      left: dimensions.rootLeft,
      width: this._rootElement.offsetWidth,
      height: this._portalModalElement.offsetHeight
    })
  }

  render() {
    const {title, onClose, children} = this.props
    const {width, left, height} = this.state
    return (
      <div
        ref={this.setRootElement}
        className={styles.root}
        style={{height: height ? `${height}px` : 'initial'}}
      >
        <StickyPortal
          isOpen
          onlyBottomSpace
          useOverlay
          addPadding={false}
          scrollIntoView={false}
          onResize={this.handleResize}
        >
          <Stacked>
            {isActive => (
              <div
                className={styles.wrapper}
                ref={this.setPortalModalElement}
                style={{
                  left: `${left}px`,
                  width: `calc(${width}px + (${styles.padding} * 2))`
                }}
              >
                <Escapable onEscape={event => ((isActive || event.shiftKey) && onClose())} />
                <CaptureOutsideClicks onClickOutside={isActive ? onClose : null}>
                  {
                    title && (
                      <div className={styles.head}>
                        {title}
                        <button className={styles.close} type="button" onClick={onClose}>
                          <CloseIcon />
                        </button>
                      </div>
                    )
                  }

                  {
                    !title && (
                      <button className={styles.closeDark} type="button" onClick={this.handleClose}>
                        <CloseIcon />
                      </button>
                    )
                  }
                  <div className={styles.content}>
                    {children}
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
