import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/fold-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import Portal from 'react-portal'
import elementResizeDetectorMaker from 'element-resize-detector'
import {delay} from 'lodash'

export default class EditItemFoldOut extends React.Component {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func
  }

  static defaultProps = {
    title: '',
    onClose() {}, // eslint-disable-line
  }

  state = {
    rootHeight: null
  }

  _elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
    this.addEventListeners()
  }

  componentDidUpdate() {
    if (this._rootElement) {
      this.moveIntoPosition()
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListeners()
  }

  addEventListeners = () => {
    if (this._rootElement && this._portalModalElement) {
      this.moveIntoPosition()
      this.tryFindScrollContainer()
      // this._rootElement.addEventListener('scroll', this.handleContentScroll)
      this._elementResizeDetector.listenTo(
        this._rootElement,
        this.handleElementResize
      )
      this._elementResizeDetector.listenTo(
        this._portalModalElement,
        this.resizeRootElement
      )
    }
  }

  removeEventListeners = () => {
    if (this._rootElement && this._portalModalElement) {
      // this._rootElement.removeEventListener('scroll', this.handleContentScroll)
      this._elementResizeDetector.removeListener(
        this._rootElement,
        this.handleElementResize
      )
      this._elementResizeDetector.removeListener(
        this._portalModalElement,
        this.resizeRootElement
      )
    }
  }

  handleContentScroll = () => {
    this.moveIntoPosition()
  }

  handleElementResize = () => {
    this.moveIntoPosition()
  }

  handleWindowResize = () => {
    clearTimeout(this._resizeTimeout)
    this._resizeTimeout = setTimeout(() => {
      this.moveIntoPosition()
    }, 40)
  }

  handleClose = event => {
    event.stopPropagation()
    this.props.onClose()
  }

  handleKeyDown = event => {
    if (event.key == 'Escape') {
      this.handleClose()
    }
  }

  handleRootClick = event => {
    event.stopPropagation()
  }

  setRootElement = element => {
    this._rootElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  tryFindScrollContainer = () => {
    let scrollContainer = this._rootElement.parentNode
    while (!this._scrollContainerElement) {
      if (!scrollContainer.parentNode) {
        break
      }
      if (['overlay', 'auto', 'scroll'].includes(window.getComputedStyle(scrollContainer).overflowY)) {
        this._scrollContainerElement = scrollContainer

        this._scrollContainerElement.onscroll = event => {
          this.moveIntoPosition()
        }

        delay(() => {
          this.moveIntoPosition()
        }, 500)

        if (__DEV__) { // eslint-disable-line max-depth
          // eslint-disable-next-line no-console
          console.info('Found a scrollcontainer: ', scrollContainer)
        }
        break
      }
      scrollContainer = scrollContainer.parentNode
    }
    if (!this._scrollContainerElement && __DEV__) {
      // eslint-disable-next-line no-console
      console.warn('No scrollcontainer ', scrollContainer)
    }
  }

  resizeRootElement = () => {
    const {height} = this._portalModalElement.getBoundingClientRect()
    const rootHeight = this._rootElement.getBoundingClientRect().height

    if (height !== rootHeight) {
      this.setState({
        rootHeight: height
      })
    }
  }

  moveIntoPosition(shouldMoveOtherModals) {

    if (!this._rootElement || !this._portalModalElement) {
      return
    }

    const {top, left, width} = this._rootElement.getBoundingClientRect()

    // Place the modal initially near the orginating element
    this._portalModalElement.style.top = `${top}px`
    this._portalModalElement.style.left = `${left}px`

    const portalElement = window.getComputedStyle(this._portalModalElement)
    const marginLeft = portalElement.getPropertyValue('margin-left')
    const marginRight = portalElement.getPropertyValue('margin-right')

    const extraWidth = (marginLeft.split('px')[0] * -1) + (marginRight.split('px')[0] * -1)

    this._portalModalElement.style.width = `${width + extraWidth}px`

    this.resizeRootElement()
  }

  renderPortal = () => {
    const {title, children} = this.props

    return (
      <Portal isOpened closeOnEsc={false}>
        <div className={styles.wrapper} ref={this.setPortalModalElement}>
          {
            title && (
              <div className={styles.head}>
                {title}
                <button className={styles.close} type="button" onClick={this.handleClose}>
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
        </div>
      </Portal>
    )
  }
  render() {
    return (
      <div
        ref={this.setRootElement}
        className={styles.root}
        onClick={this.handleRootClick}
        style={{height: this.state.rootHeight ? `${this.state.rootHeight}px` : 'initial'}}
      >
        { this.renderPortal() }
      </div>
    )
  }
}
