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
  _initialScrollTop = null
  _scrollContainerElementInitialPaddingBottom = null
  _translateYHistory = []
  _initialBodyStyleOverflow = null
  _isMoving = null
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

    // As we add padding to make room for the dialogs in the scrollcontainer,
    // save the inital padding so we can resore it when all modals are closed
    this._scrollContainerElementInitialPaddingBottom = parseInt(
        this._scrollContainerElement.style.paddingBottom, 0
      ) || 0

    // Same with the scrolltop
    this._initialScrollTop = this._scrollContainerElement.scrollTop

    // Don't allow any user scrolling of the page when modals are shown
    this._initialBodyStyleOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'


    // Set the modal as focused
    setFocus(this)

    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('resize', this.handleWindowResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
    window.removeEventListener('keydown', this.handleKeyDown)
    this._elementResizeDetector.uninstall(this._portalModalElement)
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
      this._scrollContainerElement.style.paddingBottom
        = `${this._scrollContainerElementInitialPaddingBottom}px`
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
    }, 17)
  }

  handleElementResize = el => {
    if (this._isMoving) {
      return
    }
    const offsetHeight = el.offsetHeight
    if (!this._portalOffsetHeight !== offsetHeight) {
      this.moveIntoPosition()
      this._portalOffsetHeight = offsetHeight
    }
  }

  addResizeDetector = () => {
    this._elementResizeDetector.listenTo(this._portalModalElement, this.handleElementResize)
  }

  moveIntoPosition(shouldMoveOtherModals) {
    this._isMoving = true
    const rootRects = this._rootElement.getBoundingClientRect()
    const modalRects = this._portalModalElement.getBoundingClientRect()

    // Place the modal initially near the orginating element
    const {top, left} = rootRects
    this._portalModalElement.style.position = 'absolute'
    this._portalModalElement.style.top = `${top}px`
    this._portalModalElement.style.left = `${left}px`

    const windowWidth = window.innerWidth

    const scrollContainer = this._scrollContainerElement
    const scrollTop = scrollContainer.scrollTop
    const scrollContainerRects = scrollContainer.getBoundingClientRect()

    // The visible offset of the modal within the scroll container
    const modalScrollOffset = Math.abs(
      scrollContainer.scrollHeight - scrollTop - rootRects.top - modalRects.height
    )

    // How much vertical space we have visible for the scroll container
    const spaceAvailable = scrollContainer.parentNode.offsetHeight

    // How much vertical space the modal needs
    const spaceNeeded = modalRects.height

    const newOffsetHeight = modalScrollOffset + modalRects.height

    let modalTranslateY = 0
    let newScrollTop = scrollTop

    const padding = 30

    // Make sure the whole width is visible within the screen,
    // and move arrow to point to originating element
    if ((modalRects.width + left + padding) > windowWidth) {
      const diff = windowWidth - modalRects.width - padding - left
      this._portalModalElement.style.marginLeft = `${diff}px`
      this._arrowElement.style.transform = `translateX(${diff * -1}px)`
    }

    // The bottom of the modal within the page
    const globalBottomPos = this._portalModalElement.offsetTop + modalRects.height

    // If there isn't vertical room in the scrollcontainer to show the dialog,
    // add extra padding and scroll it into view
    if (globalBottomPos > spaceAvailable) {
      // Model content is too large to display on screen
      if (spaceNeeded > spaceAvailable) {
        newScrollTop = scrollTop + rootRects.top - scrollContainerRects.top - padding
        const newHeight = spaceAvailable - (padding * 2)
        this._portalModalElement.style.height = `${newHeight}px`
      // Model content will fit on screen in whole
      } else {
        newScrollTop = scrollTop + (globalBottomPos - spaceAvailable) - padding
        this._portalModalElement.style.height = `${modalRects.height}px`
      }
      const extraPaddingBottom = (parseInt(scrollContainer.style.paddingBottom, 10) || 0) + newOffsetHeight
      scrollContainer.style.paddingBottom = `${extraPaddingBottom}px`

      // Do the scroll
      scroll.top(scrollContainer, newScrollTop, scrollOptions, () => {
        this._isMoving = false
      })

    } else {
      // No need to add extra space and scroll
      this._portalModalElement.style.height = 'auto'
      this._isMoving = false
    }

    // Move the modal along with the container scroll
    modalTranslateY = scrollTop - newScrollTop
    this._portalModalElement.style.transform = `translateY(${modalTranslateY}px)`

    // Move all other previously opened modals accordingly (on open only)
    if (shouldMoveOtherModals) {
      if (popOverStack.length > 1) {
        popOverStack.slice(0, -1).forEach(popOver => {
          const currentModalTranslateY = getComputedTranslateY(popOver._portalModalElement)
          popOver._translateYHistory.push(currentModalTranslateY)
          const newTranslateY = currentModalTranslateY + modalTranslateY
          popOver._portalModalElement.style.transform = `translateY(${newTranslateY}px)`
        })
      }
    }
  }

  handlePortalOpened = element => {
    this.moveIntoPosition(true)
    this.addResizeDetector()
  }

  setArrowElement = element => {
    this._arrowElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  setRootElement = element => {
    this._rootElement = element
    const {isOpen} = this.props
    this.setState({portalIsOpen: isOpen})
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

            <div className={styles.content}>
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
