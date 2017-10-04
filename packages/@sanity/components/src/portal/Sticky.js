/* global window, document */
import PropTypes from 'prop-types'
import React from 'react'
import styles from './styles/Sticky.css'
import Portal from 'react-portal'
//import getComputedTranslateY from './utils/getComputedTranslateY'
import elementResizeDetectorMaker from 'element-resize-detector'
import ease from 'ease-component'
import scroll from 'scroll'

//import {getComputedTranslateY} from './utils'

const scrollOptions = {
  duration: 200,
  ease: ease.easeInOutQuart
}

const PADDING_DUMMY_TRANSITION = 'height 0.2s linear'

export default class StickyPortal extends React.Component {

  static propTypes = {
    children: PropTypes.node.isRequired,
    isOpen: PropTypes.bool,
    onlyBottomSpace: PropTypes.bool,
    stickToTop: PropTypes.bool,
    ignoreScroll: PropTypes.bool,
    onClose: PropTypes.func,
    onResize: PropTypes.func,
    useOverlay: PropTypes.bool,
    scrollIntoView: PropTypes.bool,
    addPadding: PropTypes.bool,
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
    onClose: () => {},
    onResize: () => {}
  }

  state = {
    portalIsOpen: false,
    isFocused: true,
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
    }
  }

  componentWillUnmount() {
    this.scrollBack()

    if (this._paddingDummy) {
      this._paddingDummy.style.height = '0'
    }
    if (window) {
      window.removeEventListener('resize', this.handleWindowResize)
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
    if (prevProps.scrollContainer != this.props.scrollContainer) {
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

    if (this.props.addPadding) {
      const extraHeight = this._contentElement.offsetHeight
      this._paddingDummy.style.height = `${extraHeight}px`
    }

    const scrollTop = this._scrollContainerElement.scrollTop
    this._extraScrollTop = -window.innerHeight + neededHeight + this._rootTop

    if (this._extraScrollTop > 0) {
      this._initialScrollTop = scrollTop
      this._isScrolling = true
      scroll.top(this._scrollContainerElement, scrollTop + this._extraScrollTop, scrollOptions, () => {
        this._isScrolling = false
        this.props.onResize({
          isScrolling: this._isScrolling
        })
      })
    }
  }

  setContentScrollTop = event => {
    //this._contentElement.scrollTop = this._contentScrollTop
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

  handleClose() {
    this.props.onClose()
  }

  handleBackdropClick = event => {
    // console.log('handleBackdropClick')
    this.handleClose()
    event.stopPropagation()
    event.preventDefault()
  }

  handleWindowResize = () => {
    // console.log('handleWindowResize')
    // clearTimeout(this._resizeTimeout)
    // this.moveIntoPosition()
    // this._resizeTimeout = setTimeout(() => {
    this.handleWindowResizeDone()
    // }, 70)
  }

  appendPadding = () => {
    // console.log('appendPadding')
    if (!this._paddingDummy && this._contentElement) {
      this._paddingDummy = document.createElement('div')
      this._paddingDummy.style.clear = 'both'
      this._paddingDummy.style.height = 0
      this._paddingDummy.style.transition = PADDING_DUMMY_TRANSITION
      if (this._scrollContainerElement) {
        //console.info('appendPadding: added padding element', this._paddingDummy)
        this._scrollContainerElement.appendChild(this._paddingDummy)
      } else {
        //console.error('appendPadding: no scrollContainer to add padding to')
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
      //console.error('setScrollContainerElement: No scrollcontainer')
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

  initScrollContainer = element => {
    if (!element) {
      return
    }
    const {width, left} = element.getBoundingClientRect()
    this._scrollContainerLeft = left
    this._scrollContainerWidth = width
    if (!this.props.ignoreScroll && element) {
      element.addEventListener('scroll', this.handleContainerScroll, {passive: true})
    }
    this.setRootRects()
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
    // console.log('resizeAvailableSpace')
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
    // Remove listeners, as we don't want anything the be triggered while
    // we are manipulating the modal
    //this.removeMovingListeners()
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

  setContentElement = element => {
    this._contentElement = element
    // if (this._contentElement) {
    //   const neededHeight = this._contentElement.offsetHeight
    //   const padding = -window.innerHeight + this._rootTop + neededHeight
    //   if (padding > 0) {
    //     this._paddingDummy.style.height = `${padding}px`
    //   }
    // } else {
    //   console.error('setContentElement: no content element')
    // }
  }

  setRootElement = element => {
    this._rootElement = element
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
        <Portal isOpened={isOpen && portalIsOpen} closeOnEsc={false} onOpen={this.handlePortalOpened} className={styles.portal}>
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
                ref={this.setContentElement}
                className={styles.content}
                style={{
                  top: `${contentTop}px`,
                  left: `${contentLeft}px`
                  // maxWidth: `${availableWidth}px`,
                  // maxHeight: `${availableHeight}px`,
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
