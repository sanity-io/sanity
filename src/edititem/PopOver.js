import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/edititem/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import {debounce} from 'lodash'
import CloseIcon from 'part:@sanity/base/close-icon'

export default class EditItemPopOver extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClose: PropTypes.func,
    isCreatingNewItem: PropTypes.bool,
    actions: PropTypes.arrayOf(PropTypes.object)
  }

  static defaultProps = {
    onClose() {},
    actions: []
  }

  constructor() {
    super()
    this.handleClose = this.handleClose.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.handleMouseDown = this.handleMouseDown.bind(this)
    this.setRootElement = this.setRootElement.bind(this)
    this.setInnerElement = this.setInnerElement.bind(this)
    this.setArrowElement = this.setArrowElement.bind(this)
    this.repositionElement = this.repositionElement.bind(this)
    this.handleResize = debounce(this.handleResize.bind(this), 17) // 60fps
    this.resetPosition = this.resetPosition.bind(this)
  }

  handleClose() {
    this.props.onClose()
  }

  handleClick(event) {
    event.stopPropagation()
  }

  handleMouseDown(event) {
    event.stopPropagation()
  }

  repositionElement() {
    const rootElement = this._rootElement
    const innerElement = this._innerElement

    if (rootElement && innerElement) {
      const width = rootElement.offsetWidth
      const left = rootElement.offsetLeft

      const windowWidth = window.innerWidth
      const padding = 30

      const margin = parseInt(innerElement.style.marginLeft, 10) || 0

      if ((width + left - margin + padding) > windowWidth) {
        const diff = windowWidth - width - padding - left + margin
        innerElement.style.marginLeft = `${diff}px`
        this._arrowElement.style.transform = `translateX(${diff * -1}px)`
      } else {
        this.resetPosition()
      }
    }
  }

  resetPosition() {
    this._innerElement.style.marginLeft = '0'
    this._arrowElement.style.transform = 'translateX(0px)'
  }

  handleResize() {
    // Uses the css the determine if it should reposition with an Media Query
    const computedStyle = window.getComputedStyle(this._rootElement, '::before')
    const contentValue = computedStyle.getPropertyValue('content')
    const shouldReposition = contentValue === '"shouldReposition"' // Is quoted

    if (shouldReposition) {
      this.repositionElement()
    } else {
      this.resetPosition()
    }
  }


  componentDidMount() {
    this.handleResize()
    window.addEventListener('resize', this.handleResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize)
  }

  setRootElement(element) {
    this._rootElement = element
  }
  setInnerElement(element) {
    this._innerElement = element
  }

  setArrowElement(element) {
    this._arrowElement = element
  }

  render() {
    const {title, children, className, isCreatingNewItem, actions} = this.props
    return (
      <div className={`${styles.root} ${className}`} onClick={this.handleClick} onMouseDown={this.handleMouseDown} ref={this.setRootElement}>
        <div className={styles.overlay} />
        <div className={styles.inner} ref={this.setInnerElement}>
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
                      onClick={this.handleActionClick}
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
    )
  }
}
