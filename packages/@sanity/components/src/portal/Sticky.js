/* global window, document */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Sticky.css'
import Portal from 'react-portal'
import elementResizeDetectorMaker from 'element-resize-detector'
import ease from 'ease-component'
import scroll from 'scroll'
import {throttle} from 'lodash'

const scrollOptions = {
  duration: 200,
  ease: ease.easeInOutQuart
}

const PADDING = 50
const PADDING_DUMMY_TRANSITION = 'height 0.2s linear'

export default class Sticky extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    onlyBottomSpace: PropTypes.bool,
    stickToTop: PropTypes.bool,
    onResize: PropTypes.func,
    useOverlay: PropTypes.bool,
    scrollIntoView: PropTypes.bool,
    addPadding: PropTypes.bool,
    wantedHeight: PropTypes.number,
    scrollContainer: PropTypes.object // DOM element
  }

  static defaultProps = {
    scrollContainer: undefined,
    stickToTop: false,
    onlyBottomSpace: true,
    isOpen: true,
    useOverlay: true,
    scrollIntoView: true,
    addPadding: true,
    onResize: () => {},
  }

  static contextTypes = {
    getScrollContainer: PropTypes.func
  }

  state = {
    portalIsOpen: false,
    availableSpaceTop: 0,
    contentTop: 0,
    contentLeft: 0,
  }

  _elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})
  _containerScrollTop = 0
  _initialScrollTop = 0
  _isScrolling = false

  // Root positions
  _rootTop = 0
  _rootLeft = 0

  // ScrollContainer positions
  _scrollContainerLeft = 0
  _scrollContainerWidth = 0

  componentDidMount() {

    const {getScrollContainer} = this.context
    const scrollContainer = (typeof getScrollContainer === 'function' && getScrollContainer()) || document.body
    this.setScrollContainerElement(scrollContainer)

    if (window) {
      window.addEventListener('resize', this.handleWindowResize)
      window.addEventListener('scroll', this.handleWindowScroll, {passive: true, capture: true})
    }
  }

  componentWillUnmount() {
    this.scrollBack()

    if (this._paddingDummy) {
      this._paddingDummy.style.height = '0'
    }
    if (window) {
      window.removeEventListener('resize', this.handleWindowResize)
      window.removeEventListener('scroll', this.handleWindowScroll, {passive: true, capture: true})
    }

    if (this._scrollContainerElement) {
      this._scrollContainerElement.removeEventListener('scroll', this.handleContainerScroll, {passive: true})
    }

    if (this._elementResizeDetector && this._contentElement && this._contentElement.firstChild) {
      this._elementResizeDetector.uninstall(this._contentElement.firstChild)
    }

    if (this._paddingDummy) {
      this._paddingDummy.removeEventListener('transitionend', () => {
        this._paddingDummy.remove()
      }, false)
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.onlyBottomSpace !== this.props.onlyBottomSpace) {
      this.moveIntoPosition()
    }
    if (prevProps.wantedHeight !== this.props.wantedHeight) {
      this.scrollIntoView()
    }
    if (prevProps.stickToTop !== this.props.stickToTop) {
      this.moveIntoPosition()
    }
  }

  handlePortalOpened = () => {
    this.moveIntoPosition()
    this.addMovingListeners()
    this.handleWindowResize()
    this.appendPadding()
  }

  handleContainerScroll = () => {
    this._containerScrollTop = this._scrollContainerElement.scrollTop
    this.moveIntoPosition()
  }

  scrollBack = () => {
    if (this._scrollContainerElement && this._initialScrollTop) {
      this._isScrolling = true
      scroll.top(this._scrollContainerElement, this._initialScrollTop, scrollOptions, () => {
        this._isScrolling = false
      })
    }
  }

  scrollIntoView = () => {
    if (!this.props.scrollIntoView) {
      return
    }
    if (!this._scrollContainerElement) {
      return
    }

    if (!this._contentElement) {
      return
    }

    const neededHeight = this.props.wantedHeight || this._contentElement.offsetHeight

    if (this.props.addPadding && neededHeight) {
      const extraHeight = Math.min(this._contentElement.offsetHeight, window.innerHeight)
      this._paddingDummy.style.height = `${extraHeight}px`
    }

    const scrollTop = this._scrollContainerElement.scrollTop

    const scrollContainerHeight = this._scrollContainerElement.offsetHeight

    if ((this._rootTop + neededHeight) > scrollContainerHeight) {
      this._extraScrollTop
      = -window.innerHeight
      + neededHeight
      + this._rootTop

      this._initialScrollTop = scrollTop
      this._isScrolling = true
      const newScrollTop = scrollTop + this._extraScrollTop + PADDING

      scroll.top(this._scrollContainerElement, newScrollTop, scrollOptions, () => {
        this._isScrolling = false
        this.props.onResize({
          isScrolling: this._isScrolling
        })
      })
    }
  }

  addMovingListeners = () => {
    if (this._elementResizeDetector && this._contentElement && this._contentElement.firstChild) {
      this._elementResizeDetector.listenTo(
        this._contentElement.firstChild,
        this.handleElementResize
      )
    }
  }

  handleWindowResize = throttle(() => {
    this.moveIntoPosition()
  }, 1000 / 60)

  handleWindowScroll = throttle(() => {
    this.moveIntoPosition()
  }, 1000 / 60)

  appendPadding = () => {
    if (this.props.addPadding && !this._paddingDummy && this._contentElement) {
      this._paddingDummy = document.createElement('div')
      this._paddingDummy.style.clear = 'both'
      this._paddingDummy.style.height = 0
      this._paddingDummy.style.transition = PADDING_DUMMY_TRANSITION
      if (this._scrollContainerElement) {
        this._scrollContainerElement.appendChild(this._paddingDummy)
      }
    }
    this.scrollIntoView()
  }

  setRootRects() {
    if (!this._rootElement) {
      return
    }
    const {top, left} = this._rootElement.getBoundingClientRect()
    this._rootTop = top
    this._rootLeft = left
  }

  setScrollContainerElement = element => {
    if (!element) {
      return
    }
    this._scrollContainerElement = element

    this.setState({
      portalIsOpen: true
    })
  }

  stickToRoot = () => {
    const {stickToTop, onlyBottomSpace} = this.props
    this.setRootRects()
    const newState = {}
    if (onlyBottomSpace) {
      if (this._rootTop < 0 && stickToTop) {
        newState.availableSpaceTop = 0
      } else {
        newState.availableSpaceTop = this._rootTop
      }
      newState.contentTop = 0
      newState.contentLeft = 0
    } else {
      newState.availableSpaceTop = 0
      newState.contentTop = this._rootTop
      newState.contentLeft = this._rootLeft
    }
    newState.availableSpaceLeft = 0
    this.setState(newState)
    this.resizeAvailableSpace()
  }

  resizeAvailableSpace() {
    const {stickToTop, onlyBottomSpace} = this.props
    const availableWidth = window.innerWidth

    let availableHeight = window.innerHeight

    if (onlyBottomSpace) {
      availableHeight = window.innerHeight - this._rootTop
      if (this._rootTop < 0 && stickToTop) {
        availableHeight = window.innerHeight
      }
    }

    this.setState({
      availableWidth: availableWidth,
      availableHeight: availableHeight
    })
    this.setRootRects()
  }

  moveIntoPosition = () => {
    this.stickToRoot()

    this.props.onResize({
      rootLeft: this._rootLeft,
      rootTop: this._rootTop,
      containerWidth: this._scrollContainerWidth,
      containerLeft: this._scrollContainerLeft,
      availableWidth: this.state.availableWidth || window.innerWidth,
      availableHeight: this.state.availableHeight || window.innerHeight,
      isScrolling: this._isScrolling
    })
  }

  handleElementResize = el => {
    this.moveIntoPosition()
  }

  // Set elements
  setAvailableSpaceElement = element => {
    this._availableSpaceElement = element
  }

  setRootElement = element => {
    this._rootElement = element
  }

  setContentElement = element => {
    this._contentElement = element
  }

  render() {
    const {
      useOverlay,
      children,
      isOpen
    } = this.props

    const {
      availableSpaceTop,
      availableWidth,
      availableHeight,
      contentTop,
      contentLeft,
      portalIsOpen
    } = this.state

    return (
      <span ref={this.setRootElement} className={styles.root}>
        <Portal
          isOpened={isOpen && portalIsOpen}
          closeOnEsc={false}
          onOpen={this.handlePortalOpened}
          className={styles.portal}
        >
          <div className={styles.portalInner}>
            {
              useOverlay && <div className={styles.overlay} />
            }
            <div
              className={styles.availableSpace}
              ref={this.setAvailableSpaceElement}
              style={{
                top: `${availableSpaceTop}px`,
                width: `${availableWidth}px`,
                height: `${availableHeight}px`
              }}
            >
              <div
                className={styles.content}
                ref={this.setContentElement}
                style={{
                  top: `${contentTop}px`,
                  left: `${contentLeft}px`
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </Portal>
      </span>
    )
  }
}
