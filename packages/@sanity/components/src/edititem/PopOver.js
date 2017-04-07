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
    isFocused: true
  }

  componentWillMount() {
    // Set all underlaying modals as unfocused
    popOverStack.forEach(popOver => {
      popOver.setState({isFocused: false})
    })
    // Add it to the stack
    popOverStack.push(this)
  }

  componentDidMount() {

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

    // Don't allow any user scrolling of the page when modals are shown
    this._initialBodyStyleOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('resize', this.handleWindowResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
    window.removeEventListener('keydown', this.handleKeyDown)
    this._elementResizeDetector.uninstall(this._contentElement.firstChild)
    popOverStack.pop()
    const prevPopOver = popOverStack.slice(-1)[0]
    if (prevPopOver) {
      setFocus(prevPopOver)
      prevPopOver.moveIntoPosition()
    }
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
    const scrollHeight = el.scrollHeight
    if (scrollHeight !== this._contentElementScrollHeight) {
      this._contentElementScrollHeight = scrollHeight
      if (this.state.isFocused) {
        this.moveIntoPosition()
      }
    }
  }

  setContentScrollTop = event => {
    this._contentElement.scrollTop = this._contentScrollTop
  }

  addMovingListeners = () => {
    this._contentElement.addEventListener('scroll', this.handleContentScroll)
    this._contentElement.addEventListener('focusin', this.setContentScrollTop)
    this._elementResizeDetector.listenTo(
      this._contentElement.firstChild,
      this.handleElementResize
    )
  }

  removeMovingListeners = () => {
    this._contentElement.removeEventListener('focusin', this.setContentScrollTop)
    this._contentElement.removeEventListener('scroll', this.handleContentScroll)
    this._elementResizeDetector.removeListener(
      this._contentElement.firstChild,
      this.handleElementResize
    )
  }

  moveIntoPosition(shouldMoveOtherModals) {
    // Remove listeners, as we don't want anything the be triggered while
    // we are manipulating the modal
    this.removeMovingListeners()

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

    // Make sure the whole width is visible within the screen,
    // and move arrow to point to originating element
    if ((modalRects.width + left + padding) > windowWidth) {
      const diff = windowWidth - modalRects.width - padding - left
      this._portalModalElement.style.marginLeft = `${diff}px`
      this._arrowElement.style.transform = `translateX(${diff * -1}px)`
    }

    // Helper function to get the most current modal bottom
    const modalBottom = () => this._portalModalElement.offsetTop + this._portalModalElement.offsetHeight

    let scrollContainerRects = scrollContainer.getBoundingClientRect()

    const doesNotFitWithinScreen = modalBottom() + padding > scrollContainerRects.bottom

    // If there isn't vertical room in the scrollcontainer to show the dialog,
    // add extra padding and scroll it into view
    if (doesNotFitWithinScreen) {

      // Add padding

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

      const contextVisibilityHeight = 50

      // Model content is too large to display on screen
      if (modalRects.height >= (scrollContainerRects.height - contextVisibilityHeight - padding)) {
        // Set this modal to max possible height
        const newHeight = scrollContainer.offsetHeight - padding - contextVisibilityHeight

        this._portalModalElement.style.height = `${newHeight}px`

        if (this._contentElement.className !== styles.contentWithScroll) { // eslint-disable-line max-depth
          this._contentElement.className = styles.contentWithScroll
        }
        // Set back scroll position of modal content if something is resizing
        // it and triggering this.handleElementResize
        this._contentElement.scrollTop = this._contentScrollTop
      } else {
        this._contentElement.className = styles.content
      }

      // The new scollposition of the scollcontainer
      newScrollTop = scrollContainer.scrollTop
        + (modalBottom() - scrollContainerRects.bottom)
        + padding

      // If we already have translated, add that to the new scrolltop
      newScrollTop += currentModalTranslateY

      // Set the new translate
      modalTranslateY = scrollTop - newScrollTop + currentModalTranslateY
      this._portalModalElement.style.transform = `translateY(${modalTranslateY}px)`

      // Do the scroll
      scroll.top(scrollContainer, newScrollTop, scrollOptions, this.addMovingListeners)

    } else {  // Model content fits within the current screen
      this._contentElement.className = styles.content
      // Set the new translate
      modalTranslateY = scrollTop - this._initialScrollTop + currentModalTranslateY
      this._portalModalElement.style.transform = `translateY(${modalTranslateY}px)`
      // Do the scroll
      scroll.top(scrollContainer, this._initialScrollTop, scrollOptions, this.addMovingListeners)
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
    this._contentScrollTop = event.target.scrollTop
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

            <div ref={this.setContentElement}>
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
