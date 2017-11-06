/* global window, document */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Sticky.css'
import Portal from 'react-portal'
import elementResizeDetectorMaker from 'element-resize-detector'
import ease from 'ease-component'
import scroll from 'scroll'
import {throttle} from 'lodash'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import Stacked from '../utilities/Stacked'

const scrollOptions = {
  duration: 200,
  ease: ease.easeInOutQuart
}

const PADDING_DUMMY_TRANSITION = 'height 0.2s linear'

export default class Sticky extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    onlyBottomSpace: PropTypes.bool,
    stickToTop: PropTypes.bool,
    ignoreScroll: PropTypes.bool,
    onResize: PropTypes.func,
    useOverlay: PropTypes.bool,
    scrollIntoView: PropTypes.bool,
    addPadding: PropTypes.bool,
    onClickOutside: PropTypes.func,
    onEscape: PropTypes.func,
    scrollContainer: PropTypes.object // DOM element
  }

  static defaultProps = {
    scrollContainer: undefined,
    stickToTop: false,
    onlyBottomSpace: true,
    isOpen: true,
    ignoreScroll: false,
    useOverlay: true,
    scrollIntoView: true,
    addPadding: true,
    onResize: () => {},
    onClickOutside: () => {},
    onEscape: () => {}
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
    const {
      scrollContainer
    } = this.props

    if (scrollContainer) {
      this.setScrollContainerElement(scrollContainer)
    }

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
    if (prevProps.scrollContainer !== this.props.scrollContainer) {
      this.setScrollContainerElement(this.props.scrollContainer)
    }
    if (prevProps.onlyBottomSpace !== this.props.onlyBottomSpace) {
      this.moveIntoPosition()
    }
    if (prevProps.stickToTop !== this.props.stickToTop) {
      this.moveIntoPosition()
    }
  }

  handlePortalOpened = () => {
    if (this._scrollContainerElement) {
      this._initialScrollTop = this._scrollContainerElement.scrollTop
    }
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
      //console.error('scrollIntoView: Missing scrollContainer element')
      return
    }

    if (!this._contentElement) {
      //console.error('scrollIntoView: Missing content element')
      return
    }

    const neededHeight = this._contentElement.offsetHeight

    if (this.props.addPadding && neededHeight > this._scrollContainerElement.offsetHeight) {
      const extraHeight = Math.min(this._contentElement.offsetHeight, window.innerHeight - 200)
      this._paddingDummy.style.height = `${extraHeight}px`
    }

    const scrollTop = this._scrollContainerElement.scrollTop
    this._extraScrollTop = -this._scrollContainerElement.offsetHeight + neededHeight + this._rootTop
    if (this._extraScrollTop > 0 && this._contentElement.offsetHeight < this._scrollContainerElement.offsetHeight) {
      this._initialScrollTop = scrollTop
      this._isScrolling = true
      const newScrollTop = scrollTop + this._extraScrollTop
      scroll.top(this._scrollContainerElement, newScrollTop, scrollOptions, () => {
        this._isScrolling = false
        this.props.onResize({
          isScrolling: this._isScrolling
        })
      })
    }
  }

  addMovingListeners = () => {
    //if (this._contentElement) {
    //  this._contentElement.addEventListener('scroll', this.handleContentScroll)
    //}
    if (this._elementResizeDetector && this._contentElement && this._contentElement.firstChild) {
      this._elementResizeDetector.listenTo(
        this._contentElement.firstChild,
        this.handleElementResize
      )
    }
  }

  removeMovingListeners = () => {
    if (this._contentElement) {
      this._contentElement.removeEventListener('scroll', this.handleContentScroll)
    }
    if (this._elementResizeDetector && this._contentElement && this._contentElement.firstChild) {
      this._elementResizeDetector.removeListener(
        this._contentElement.firstChild,
        this.handleElementResize
      )
    }
  }

  handleContentScroll = event => {
    //this._contentScrollTop = event.target.scrollTop
  }

  handleWindowResize = throttle(() => {
    this.handleWindowResizeDone()
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

  handleWindowResizeDone() {
    this.moveIntoPosition()
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

    this._scrollContainerElement.addEventListener(
      'scroll',
      this.handleContainerScroll,
      {passive: true}
    )

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
      onClickOutside,
      onEscape,
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
        <Stacked>
          {isActive => (
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
                  <Escapable onEscape={event => ((isActive || event.shiftKey) && onEscape(event))} />
                  <div
                    className={styles.content}
                    ref={this.setContentElement}
                    style={{
                      top: `${contentTop}px`,
                      left: `${contentLeft}px`
                    }}>
                    <CaptureOutsideClicks onClickOutside={isActive ? onClickOutside : null}>
                      {children}
                    </CaptureOutsideClicks>
                  </div>
                </div>
              </div>
            </Portal>
          )}
        </Stacked>
      </span>
    )
  }
}
