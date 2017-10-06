import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/fold-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import tryFindScrollContainer from '../utilities/tryFindScrollContainer'

export default class EditItemFoldOut extends React.PureComponent {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    scrollContainer: PropTypes.node
  }

  static defaultProps = {
    title: '',
    scrollContainer: undefined,
    onClose() {}, // eslint-disable-line
  }

  state = {
    scrollContainer: undefined
  }

  componentDidMount() {
    const {scrollContainer} = this.props

    if (scrollContainer) {
      this.setScrollContainerElement(scrollContainer)
    } else {
      this.setScrollContainerElement(tryFindScrollContainer(this._rootElement))
    }
    window.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  setScrollContainerElement = element => {
    this.setState({
      scrollContainer: element
    })
  }

  handleClose = event => {
    if (event) {
      event.stopPropagation()
    }
    this.props.onClose()
  }

  handleKeyDown = event => {
    if (event.key == 'Escape') {
      this.handleClose()
    }
  }

  setRootElement = element => {
    this._rootElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  handleResize = dimensions => {
    this.setState({
      left: dimensions.rootLeft,
      width: this._rootElement.offsetWidth,
      height: this._portalModalElement.offsetHeight
    })
  }

  render() {
    const {title, children} = this.props
    const {scrollContainer, width, left, height} = this.state
    return (
      <div
        ref={this.setRootElement}
        className={styles.root}
        style={{height: height ? `${height}px` : 'initial'}}
      >
        <StickyPortal
          isOpen
          onlyBottomSpace
          useOverlay
          scrollContainer={scrollContainer}
          addPadding={false}
          scrollIntoView={false}
          onResize={this.handleResize}
        >
          <div
            className={styles.wrapper}
            ref={this.setPortalModalElement}
            style={{
              left: `${left}px`,
              width: `calc(${width}px + (${styles.padding} * 2))`
            }}
          >
            {
              title && (
                <div className={styles.head}>
                  {title}
                  <button className={styles.close} type="button" onClick={this.handleClose}>
                    <CloseIcon />
                  </button>
                </div>
              )
            }

            {
              !title && (
                <button className={styles.closeDark} type="button" onClick={this.handleClose}>
                  <CloseIcon />
                </button>
              )
            }
            <div className={styles.content}>
              {children}
            </div>
          </div>
        </StickyPortal>
      </div>
    )
  }
}
