import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/edititem/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import {debounce} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'
import scroll from 'scroll'
import ease from 'ease-component'
import Portal from './Portal'

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
    this.handleClose = this.handleClose.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.repositionElement = this.repositionElement.bind(this)
    this.handleResize = debounce(this.handleResize.bind(this), 17) // 60fps
    this.resetPosition = this.resetPosition.bind(this)
    this.scrollOptions = {
      duration: 250,
      ease: ease.easeInOutQuart
    }
    this.state = {
      scrollContainer: null
    }
  }

  handleClose() {
    const {scrollContainer} = this.state
    if (scrollContainer) {
      scroll.top(scrollContainer, this.initialScrollTop, this.scrollOptions)
    }
    this.props.onClose()
  }

  handleClick(event) {
    // event.stopPropagation()
  }

  handleMouseDown(event) {
    event.stopPropagation()
  }

  repositionElement() {
    const {scrollContainer} = this.state
    const {rootRects} = this.state
    const rootElement = this._rootElement
    const portalModalElement = this._portalModalElement

    if (!rootElement || !portalModalElement || !rootRects) {
      return
    }

    const portalModalRects = portalModalElement.getClientRects()[0]
    const scrollTop = scrollContainer.scrollTop
    const width = portalModalRects.width
    const height = portalModalRects.height
    const left = rootRects.left
    const top = rootRects.top

    // we can use window since we don't support horizontal scrolling
    // and the backdrop is fixed
    const windowWidth = window.innerWidth
    const containerOffsetHeight = scrollContainer.offsetHeight

    const padding = 30

    const margin = 0


    // Scroll container when there is no space
    if ((containerOffsetHeight) < (top + height)) {
      let newScrollTop = (containerOffsetHeight - top - height - scrollTop - padding) * -1

      // If element is to big for screen, scroll top only top of the element
      if (height > containerOffsetHeight) {
        newScrollTop = top + scrollTop - (padding * 3)
      }

      scroll.top(scrollContainer, newScrollTop, this.scrollOptions)
    }

    // Need more bottom space
    if (scrollContainer.scrollHeight < (scrollTop + top + height)) {
      const extraPaddingBottom = Math.abs(scrollContainer.scrollHeight - scrollTop - height - top)
      scrollContainer.style.marginBottom = `${extraPaddingBottom}px`
      let newScrollTop = (containerOffsetHeight - top - height - scrollTop) * -1

      // If element is to big for screen, scroll top only top of the element
      if (height > containerOffsetHeight) {
        newScrollTop = top + scrollTop - (padding * 3)
      }
      scroll.top(scrollContainer, newScrollTop, this.scrollOptions)
    }

    // Reposition horizon
    if ((width + left - margin + padding) > windowWidth) {
      const diff = windowWidth - width - padding - left + margin
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
    const {scrollContainer} = this.state

    if (scrollContainer && this.initialScrollTop) {
      scroll.top(scrollContainer, this.initialScrollTop, this.scrollOptions)
    }
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  setRootElement = element => {
    this._rootElement = element
    if (element) {
      const rootRects = element.getClientRects()[0]
      this.setState({
        rootRects: rootRects
      })
    }
  }

  setPortalInnerElement = element => {
    this._portalInnerElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  setArrowElement = element => {
    this._arrowElement = element
  }

  handleKeyDown = event => {
    if (event.key == 'Escape') {
      this.handleClose()
      event.stopPropagation()
    }
  }

  handleBackdropClick = event => {
    event.stopPropagation()
    event.preventDefault()
    this.handleClose()
  }

  handleBackdropMouseDown = event => {
    event.stopPropagation()
    event.preventDefault()
  }

  handleModalClick = event => {
    event.preventDefault()
    event.stopPropagation()
  }
  handleModalMouseDown = event => {
    event.stopPropagation()
  }

  getScrollContainer = () => {
    return this.scrollContainer
  }

  renderPortal = (scrollContainer, rootRects) => {
    const {title, children, className, isCreatingNewItem, actions, fullWidth} = this.props
    const {top, left} = rootRects

    this.initialScrollTop = scrollContainer.scrollTop

    window.addEventListener('resize', this.handleResize)
    window.addEventListener('keydown', this.handleKeyDown)


    return (
      <Portal
        isOpen
        scrollContainer={scrollContainer}
        onClose={this.handleClose}
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
          onClick={this.handleModalClick}
        >
          <div
            className={styles.portalModal}
            ref={this.setPortalModalElement}
            style={{
              position: 'absolute',
              top: `${top + this.initialScrollTop}px`,
              left: `${left}px`
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
        <span className={styles.overlay} onClick={this.handleBackdropClick} />
        {
          scrollContainer && isOpen && this.renderPortal(scrollContainer, rootRects)
        }
      </span>
    )
  }
}
