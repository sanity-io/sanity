import React, {PropTypes} from 'react'
import styles from 'style:@sanity/components/edititem/popover'
import Button from 'component:@sanity/components/buttons/default'

export default class EditItemPopOver extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClose: PropTypes.func,
    isCreatingNewItem: PropTypes.bool
  }

  static defaultProps = {
    onClose() {}
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
    this.handleResize = this.handleResize.bind(this)
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
    // TODO: lodash debounce resize updates

    const innerElement = this._innerElement

    const width = this._rootElement.offsetWidth
    const left = this._rootElement.offsetLeft

    const windowWidth = window.innerWidth
    const padding = 30

    // Transform approach
    // Right side crash
    // if ((width + left) > windowWidth) {
    //   const diff = windowWidth - width - padding - left
    //   innerElement.style.transform = `translateX(${diff}px)`
    //   this._arrowElement.style.transform = `translateX(${diff * -1}px)`
    // } else {
    //   innerElement.style.transform = 'translateX(0px)'
    //   this._arrowElement.style.transform = 'translateX(0px)'
    // }

    const margin = parseInt(innerElement.style.marginLeft, 10) || 0

    if ((width + left - margin + padding) > windowWidth) {
      const diff = windowWidth - width - padding - left + margin
      innerElement.style.marginLeft = `${diff}px`
      this._arrowElement.style.transform = `translateX(${diff * -1}px)`
    } else {
      innerElement.style.marginLeft = '0'
      this._arrowElement.style.transform = 'translateX(0px)'
    }

  }

  handleResize() {
    this.repositionElement()
  }

  componentDidMount() {
    this.repositionElement(this._rootElement)
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
    const {title, children, className, isCreatingNewItem} = this.props
    return (
      <div className={`${styles.root} ${className}`} onClick={this.handleClick} onMouseDown={this.handleMouseDown} ref={this.setRootElement}>
        <div className={styles.overlay}></div>
        <div className={styles.inner} ref={this.setInnerElement}>
          <div className={styles.arrow} ref={this.setArrowElement} />
          <div className={styles.head}>
            <h3 className={styles.title}>
              {
                isCreatingNewItem && 'New '
              }
              {title}
            </h3>
            <button className={styles.close} type="button" onClick={this.handleClose}>Close</button>
          </div>

          <div className={styles.content}>
            {children}
          </div>

          <div className={styles.primaryFunctions}>
            <Button type="button" onClick={this.handleClose} ripple colored>Close</Button>
          </div>
        </div>
      </div>
    )
  }
}
