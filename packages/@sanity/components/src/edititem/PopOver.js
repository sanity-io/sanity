import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/edititem/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import {debounce} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import scroll from 'scroll'
import ease from 'ease-component'
import Portal from 'react-portal'
// import elementResizeDetectorMaker from 'element-resize-detector'

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
    onNeedScroll: PropTypes.func,
    scrollContainer: PropTypes.node,
    scrollContainerId: PropTypes.string,
    isOpen: PropTypes.bool
  }

  static defaultProps = {
    onClose() {}, // eslint-disable-line
    scrollContainerId: 'Sanity_Default_DeskTool_Editor_ScrollContainer',
    actions: [],
    isOpen: true
  }

  constructor(props) {
    super()
    this.handleResize = debounce(this.handleResize.bind(this), 17) // 60fps
    this.scrollOptions = {
      duration: 250,
      ease: ease.easeInOutQuart
    }
    this.state = {
      scrollContainer: null,
      rootOffsetTop: 0,
      modalTranslateY: 0,
      fullHeight: false,
      portalModalRects: {
        top: undefined,
        left: undefined,
        right: undefined,
        height: undefined,
        bottom: undefined
      }
    }
  }

  handleClose = () => {
    const {scrollContainer} = this.state
    if (scrollContainer) {
      scroll.top(scrollContainer, this.initialScrollTop, this.scrollOptions, () => {
        scrollContainer.style.paddingBottom = '0'
      })
    }
    this.props.onClose()
  }

  repositionElement() {
    const {scrollContainer} = this.state
    const {rootRects} = this.state
    const portalModalElement = this._portalModalElement

    if (!portalModalElement || !rootRects) {
      return
    }

    const scrollTop = scrollContainer.scrollTop
    const modalRects = this._portalModalElement.getBoundingClientRect()

    // we can use window since we don't support horizontal scrolling
    // and the backdrop is fixed
    const windowWidth = window.innerWidth
    const containerOffsetHeight = scrollContainer.offsetHeight

    const padding = 30
    const margin = 0

    let newScrollTop = scrollTop

    // Scroll container when there is no space
    if (containerOffsetHeight < (rootRects.top + modalRects.height)) {
      newScrollTop = (containerOffsetHeight - rootRects.top - modalRects.height - scrollTop - padding) * -1
    }

    // Need more bottom space
    if (scrollContainer.scrollHeight < (scrollTop + rootRects.top + modalRects.height)) {
      const extraPaddingBottom = Math.abs(scrollContainer.scrollHeight - scrollTop - modalRects.height - rootRects.top)
      scrollContainer.style.paddingBottom = `${extraPaddingBottom}px`
      newScrollTop = (containerOffsetHeight - rootRects.top - modalRects.height - scrollTop) * -1
    }

    // If element is to big for screen, scroll top only top of the element
    if (modalRects.height >= containerOffsetHeight) {
      newScrollTop = rootRects.top + scrollTop - padding
    }

    this.setState({
      modalTranslateY: scrollTop - newScrollTop,
      fullHeight: modalRects.height >= containerOffsetHeight
    })

    scroll.top(scrollContainer, newScrollTop, this.scrollOptions)

    // Reposition horizon
    if ((modalRects.width + modalRects.left - margin + padding) > windowWidth) {
      const diff = windowWidth - modalRects.width - padding - modalRects.left + margin
      portalModalElement.style.marginLeft = `${diff}px`
      this._arrowElement.style.transform = `translateX(${diff * -1}px)`
    } else {
      this.resetPosition()
    }
  }

  resetPosition() {
    this._portalModalElement.style.marginLeft = '0'
    this._arrowElement.style.transform = 'translateX(0px)'
  }

  handleResize() {

    // Uses the css the determine if it should reposition with an Media Query
    const computedStyle = window.getComputedStyle(this._rootElement, '::before')
    const contentValue = computedStyle.getPropertyValue('content')
    const shouldReposition = contentValue === '"shouldReposition"' || contentValue === 'shouldReposition' // Is quoted

    if (shouldReposition) {
      this.repositionElement()
    } else {
      this.resetPosition()
    }
  }

  componentDidMount() {
    const {scrollContainerId, scrollContainer} = this.props

    window.addEventListener('resize', this.handleResize)
    window.addEventListener('keydown', this.handleKeyDown)
    //this.elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})

    // Sets a scrollContainer with ID
    if (scrollContainerId) {
      this.setState({
        scrollContainer: document.getElementById(scrollContainerId)
      })
    }

    if (scrollContainer) {
      this.setState({
        scrollContainer: scrollContainer
      })
    }

  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('keydown', this.handleKeyDown)
    //this.elementResizeDetector.removeAllListeners(this._portalModalElement)
  }

  setRootElement = element => {
    this._rootElement = element
    if (element) {
      this.setState({
        rootRects: element.getBoundingClientRect()
      })
    }
  }

  setPortalInnerElement = element => {
    this._portalInnerElement = element
  }

  setPortalModalElement = element => {

    if (element) {
      this._portalModalElement = element
      this.setState({
        portalModalRects: element.getBoundingClientRect()
      })
    }

    // this.elementResizeDetector.listenTo(this._portalModalElement, el => {
    //   const portalModalRects = element.getBoundingClientRect()
    //   const oldHeight = this.state.portalModalRects.height
    //   this.setState({
    //     portalModalRects: portalModalRects
    //   })
    //   if (portalModalRects.height != oldHeight) {
    //     this.handleResize()
    //   }
    // })
  }

  setArrowElement = element => {
    this._arrowElement = element
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

  getScrollContainer = () => {
    return this.scrollContainer
  }

  renderPortal = (scrollContainer, rootRects) => {
    const {title, children, className, isCreatingNewItem, actions, fullWidth} = this.props
    const {top, left} = rootRects
    const {fullHeight, modalTranslateY} = this.state

    this.initialScrollTop = scrollContainer.scrollTop

    return (
      <Portal
        isOpened
        onOpen={this.handleResize}
      >
        <div
          className={
            `${fullWidth ? styles.fullWidth : styles.autoWidth}
            ${className || ''}`
          }
          style={{
            position: 'absolute',
            top: 0,
            left: 0
          }}
          ref={this.setPortalInnerElement}
        >
          <div className={styles.overlay} onClick={this.handleBackdropClick} />
          <div
            className={fullHeight ? styles.portalModalFullHeight : styles.portalModal}
            ref={this.setPortalModalElement}
            style={{
              position: 'absolute',
              top: `${top}px`,
              left: `${left}px`,
              transform: `translateY(${modalTranslateY}px)`
            }}
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
    const {isOpen} = this.props
    const {scrollContainer, rootRects} = this.state
    return (
      <span ref={this.setRootElement} className={styles.root}>
        {
          scrollContainer && isOpen && this.renderPortal(scrollContainer, rootRects)
        }
      </span>
    )
  }
}
