import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/edititem/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import Portal from 'react-portal'
import scroll from 'scroll'
import ease from 'ease-component'
import {getComputedTranslateY} from './utils'
import elementResizeDetectorMaker from 'element-resize-detector'

const popOverStack = []

function setFocus(focusedPopOver) {
  popOverStack.forEach(popOver => {
    popOver.setState({isFocused: popOver === focusedPopOver})
  })
}

const scrollOptions = {
  duration: 250,
  ease: ease.easeInOutQuart
}

export default class EditItemPopOver extends React.Component {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClose: PropTypes.func,
    isCreatingNewItem: PropTypes.bool,
    actions: PropTypes.arrayOf(PropTypes.shape({
      kind: PropTypes.string,
      title: PropTypes.string,
      handleClick: PropTypes.func
    })),
    fullWidth: PropTypes.bool,
    isOpen: PropTypes.bool,
    scrollContainer: PropTypes.node,
    scrollContainerId: PropTypes.string
  };

  static defaultProps = {
    onClose() {}, // eslint-disable-line
    actions: [],
    isOpen: true,
    scrollContainerId: 'Sanity_Default_DeskTool_Editor_ScrollContainer'
  };

  _rootElement = null
  _portalModalElement = null
  _arrowElement = null
  _scrollContainerElement = null
  _contentElement = null
  _initialScrollTop = null
  _translateYHistory = []
  _initialBodyStyleOverflow = null
  _portalOffsetHeight = null

  _elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})

  state = {
    portalIsOpen: false,
    isFocused: false
  }

  componentDidMount() {

    popOverStack.push(this)

    // Only set scrollcontainer once, and reuse that
    // for all stacked modals
    if (popOverStack[0] === this) {
      const {scrollContainerId, scrollContainer} = this.props
      if (scrollContainerId) {
        this._scrollContainerElement = document.getElementById(scrollContainerId)
      }
      if (scrollContainer) {
        this._scrollContainerElement = scrollContainer
      }
    } else {
      this._scrollContainerElement = popOverStack[0]._scrollContainerElement
    }

    if (!this._scrollContainerElement) {
      if (__DEV__) {
        console.warn('No scroll container found, trying to find one!') // eslint-disable-line no-console
      }
      this.tryFindScrollContainer()
    } else if (popOverStack[0] === this && !this._scrollContainerElement.contains(this._rootElement)) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('This rootElement is not a child of the scollcontainer, trying to find a valid scrollContainer!')
      }
      this._scrollContainerElement = null
      this.tryFindScrollContainer()
    }
    this._paddingDummy = document.createElement('div')
    this._paddingDummy.className = styles.paddingDummy
    this._scrollContainerElement.appendChild(this._paddingDummy)

    // Save the initial scrolltop
    this._initialScrollTop = this._scrollContainerElement.scrollTop

    // Set the modal as focused
    setFocus(this)

    // Don't allow any user scrolling of the page when modals are shown
    this._initialBodyStyleOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('resize', this.handleWindowResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
    window.removeEventListener('keydown', this.handleKeyDown)
    this._elementResizeDetector.uninstall(this._contentElement)
    popOverStack.pop()
    setFocus(popOverStack.slice(-1)[0])
    document.body.style.overflow = this._initialBodyStyleOverflow
  }

  handleClose = () => {
    if (!this.state.isFocused) {
      return
    }
    // Scroll back to original scroll position
    scroll.top(this._scrollContainerElement, this._initialScrollTop, scrollOptions, () => {
      // Remove the padding dummy
      this._scrollContainerElement.removeChild(this._paddingDummy)
    })

    // Change other modals translateY back to their initial value
    if (popOverStack.length > 1) {
      popOverStack.slice(0, -1).forEach(popOver => {
        const lastTransformY = popOver._translateYHistory.pop()
        popOver._portalModalElement.style.transform = `translateY(${lastTransformY}px)`
      })
    }
    this.props.onClose()
  }

  tryFindScrollContainer() {
    let scrollContainer = this._rootElement.parentNode
    while (!this._scrollContainerElement) {
      if (!scrollContainer.parentNode) {
        break
      }
      if (['overlay', 'auto', 'scroll'].includes(window.getComputedStyle(scrollContainer).overflowY)) {
        this._scrollContainerElement = scrollContainer
        if (__DEV__) { // eslint-disable-line max-depth
          // eslint-disable-next-line no-console
          console.warn('Found a scrollcontainer: ', scrollContainer)
        }
        break
      }
      scrollContainer = scrollContainer.parentNode
    }
    if (!this._scrollContainerElement) {
      throw new Error('PopOver needs a scrollcontainer!')
    }
  }

  handleKeyDown = event => {
    if (event.key == 'Escape') {
      this.handleClose()
    }
  }

  handleBackdropClick = event => {
    this.handleClose()
    event.stopPropagation()
    event.preventDefault()
  }

  // TODO: the modal could possible be in an unmounted state here,
  // though propably not an issue. But should be fixed.
  handleWindowResize = () => {
    clearTimeout(this._resizeTimeout)
    this._resizeTimeout = setTimeout(() => {
      this.moveIntoPosition()
    }, 40)
  }

  handleElementResize = el => {
    if (!this.state.isFocused) {
      return
    }
    const scrollHeight = el.scrollHeight
    if (this._modalContentScrollHeight) {
      if (this._modalContentScrollHeight !== scrollHeight) {
        const diff = scrollHeight - this._modalContentScrollHeight
        const newHeight = this._portalModalElement.offsetHeight + diff
        this._portalModalElement.style.height = `${newHeight}px`
        this.moveIntoPosition()
        this._modalContentScrollHeight = scrollHeight
      }
    } else {
      this._modalContentScrollHeight = scrollHeight
    }
  }

  moveIntoPosition(shouldMoveOtherModals) {

    const {top, left} = this._rootElement.getBoundingClientRect()

    // Place the modal initially near the orginating element
    this._portalModalElement.style.position = 'absolute'

    const currentModalTranslateY = getComputedTranslateY(this._portalModalElement)
    if (currentModalTranslateY === 0) {
      this._portalModalElement.style.top = `${top}px`
    }
    this._portalModalElement.style.left = `${left}px`
    this._portalModalElement.style.height = 'auto'

    const modalRects = this._portalModalElement.getBoundingClientRect()

    const windowWidth = window.innerWidth

    const scrollContainer = this._scrollContainerElement
    const scrollTop = scrollContainer.scrollTop

    let modalTranslateY = 0
    let newScrollTop

    const padding = 20

    // Set content default class (can be changed futher down if content neeeds scrolling)
    this._contentElement.className = styles.content

    // Make sure the whole width is visible within the screen,
    // and move arrow to point to originating element
    if ((modalRects.width + left + padding) > windowWidth) {
      const diff = windowWidth - modalRects.width - padding - left
      this._portalModalElement.style.marginLeft = `${diff}px`
      this._arrowElement.style.transform = `translateX(${diff * -1}px)`
    }

    const modalBottom = () => this._portalModalElement.offsetTop + this._portalModalElement.offsetHeight
    const containerBottom = () => scrollContainer.offsetTop + scrollContainer.offsetHeight

    // If there isn't vertical room in the scrollcontainer to show the dialog,
    // add extra padding and scroll it into view
    if (modalBottom() + padding > containerBottom()) {

      // Add padding
      let scrollContainerRects = scrollContainer.getBoundingClientRect()

      // First check if we need to pad down to the bottom of the scroll container
      // (content is not filling up the scroll container as we add padding from the bottom)
      let padChildToBottom = scrollContainerRects.bottom - this._paddingDummy.getBoundingClientRect().bottom
      if (padChildToBottom < 0) {
        padChildToBottom = 0
      }
      // Add needed padding to show the whole modal
      const extraPaddingBottom = padChildToBottom
        + parseInt(this._paddingDummy.style.paddingBottom || 0, 10)
        + (modalBottom() - scrollContainerRects.bottom)
        + padding
      if (extraPaddingBottom > 0) {
        this._paddingDummy.style.paddingBottom = `${extraPaddingBottom}px`
      }

      // Compute new rect after padding is applied
      scrollContainerRects = scrollContainer.getBoundingClientRect()

      // Model content is too large to display on screen
      if (modalRects.height >= (scrollContainerRects.height - padding)) {
        const newHeight = scrollContainerRects.height - scrollContainerRects.top
        this._portalModalElement.style.height = `${newHeight}px`
        newScrollTop = scrollTop
          + (modalBottom() - scrollContainerRects.bottom)
          + padding
        // Add class to get scrollbars
        this._contentElement.className = styles.contentWithScroll
        this._contentElement.scrollTop = this._contentScrollTop
      } else {
        // Model content will fit on screen in whole
        this._portalModalElement.style.height = `${modalRects.height}px`
        newScrollTop = scrollContainer.scrollTop
          + (modalBottom() - scrollContainerRects.bottom)
          + padding
      }

      // If we already have translated, add that to the new scrolltop
      if (currentModalTranslateY) {
        newScrollTop += currentModalTranslateY
      }

      if (newScrollTop > this._initialScrollTop) { // never scroll above the initial scrolltop
        // Set the new translate
        modalTranslateY = scrollTop - newScrollTop + currentModalTranslateY
        this._portalModalElement.style.transform = `translateY(${modalTranslateY}px)`

        // Do the scroll
        scroll.top(scrollContainer, newScrollTop, scrollOptions)
      }

    } else {
      // No need to add extra space and scroll
      this._portalModalElement.style.height = 'auto'
      this._isMoving = false
    }

    // Move other modals accordingly (on open)
    if (shouldMoveOtherModals) {
      popOverStack.slice(0, -1).forEach(popOver => {
        const translateY = getComputedTranslateY(popOver._portalModalElement)
        popOver._translateYHistory.push(translateY)
        const newTranslateY = translateY + modalTranslateY
        popOver._portalModalElement.style.transform = `translateY(${newTranslateY}px)`
      })
    }
  }

  handlePortalOpened = element => {
    this.moveIntoPosition(true)
    this._elementResizeDetector.listenTo(
      this._contentElement.firstChild,
      this.handleElementResize
    )
  }

  setArrowElement = element => {
    this._arrowElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  setContentElement = element => {
    this._contentElement = element
  }

  setRootElement = element => {
    this._rootElement = element
    const {isOpen} = this.props
    this.setState({portalIsOpen: isOpen})
  }

  handleContentScroll = event => {
    if (event.target.scrollTop > 0) {
      this._contentScrollTop = event.target.scrollTop
    }
  }

  renderPortal = () => {
    const {title, children, className, isCreatingNewItem, actions, fullWidth} = this.props
    const modalContainerClassName = `${fullWidth ? styles.fullWidth : styles.autoWidth} ${className || ''}`
    return (
      <Portal isOpened={this.state.portalIsOpen} closeOnEsc={false} onOpen={this.handlePortalOpened}>
        <div className={modalContainerClassName}>
          {
            this.state.isFocused && (
              <div className={styles.overlay} onClick={this.handleBackdropClick} />
            )
          }
          <div
            ref={this.setPortalModalElement}
            className={styles.portalModal}
          >

            <div className={styles.arrow} ref={this.setArrowElement} />

            <button className={styles.close} type="button" onClick={this.handleClose}>
              <CloseIcon />
            </button>

            <div className={styles.head}>
              <h3 className={styles.title}>
                {
                  isCreatingNewItem && 'New '
                }
                {title}
              </h3>
            </div>

            <div className={styles.content} ref={this.setContentElement} onScroll={this.handleContentScroll}>
              {children}
            </div>

            {
              actions.length > 0 && <div className={styles.functions}>
                {
                  actions.map((action, i) => {
                    return (
                      <Button
                        key={i}
                        onClick={action.handleClick}
                        data-action-index={i}
                        kind={action.kind}
                        className={styles[`button_${action.kind}`] || styles.button}
                      >
                        {action.title}
                      </Button>
                    )
                  })
                }
              </div>
            }
          </div>
        </div>
      </Portal>
    )
  }

  render() {
    return (
      <span ref={this.setRootElement} className={styles.root}>
        { this.renderPortal() }
      </span>
    )
  }
}
