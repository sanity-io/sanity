import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import tryFindScrollContainer from '../utilities/tryFindScrollContainer'

const PADDING = 10

export default class EditItemPopOver extends React.PureComponent {

  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    actions: PropTypes.arrayOf(PropTypes.shape({
      kind: PropTypes.string,
      title: PropTypes.string,
      key: PropTypes.string,
      handleClick: PropTypes.func
    })),
    isOpen: PropTypes.bool,
    scrollContainer: PropTypes.object
  }

  static defaultProps = {
    title: undefined,
    scrollContainer: undefined,
    onClose() {},
    actions: [],
    isOpen: true
  }

  state = {
    arrowLeft: 0,
    popoverLeft: 0,
    scrollContainer: undefined,
    isResizing: false
  }

  componentDidMount() {
    const {
      scrollContainer
    } = this.props

    if (!this._rootElement) {
      // console.error('no root element')
    }

    if (scrollContainer) {
      this.setScrollContainerElement(scrollContainer)
    } else {
      this.setScrollContainerElement(tryFindScrollContainer(this._rootElement))
    }
  }

  setScrollContainerElement = element => {
    this.setState({
      scrollContainer: element
    })
  }

  setArrowElement = element => {
    this._arrowElement = element
  }

  setContentElement = element => {
    this._contentElement = element
  }

  setPopoverInnerElement = element => {
    this._popOverInnerElement = element
  }

  setRootElement = element => {
    this._rootElement = element
  }

  handlePortalResize = dimensions => {
    if (!this._popOverInnerElement) {
      return
    }

    const {
      rootLeft,
      availableHeight,
      availableWidth,
      isScrolling
    } = dimensions

    const width = this._popOverInnerElement.offsetWidth

    let popoverLeft = rootLeft - (width / 2)

    if (availableWidth < (rootLeft + (width / 2))) {
      popoverLeft = availableWidth - width - PADDING
    }

    let maxHeight = 500

    if (availableHeight && this.state.scrollContainer) {
      maxHeight = Math.min(
        availableHeight - 16,
        this.state.scrollContainer.offsetHeight - 200
      )
    }

    this.setState({
      popoverLeft: popoverLeft,
      availableHeight: maxHeight,
      arrowLeft: rootLeft,
      isResizing: isScrolling
    })
  }

  render() {
    const {
      title,
      children,
      actions,
      onClose,
      isOpen,
    } = this.props

    const {
      popoverLeft,
      arrowLeft,
      availableHeight,
      scrollContainer,
      isResizing
    } = this.state

    return (
      <div style={{display: 'span'}} ref={this.setRootElement}>
        <StickyPortal
          isOpen={isOpen}
          scrollContainer={scrollContainer}
          onResize={this.handlePortalResize}
          onEscape={onClose}
          onClickOutside={onClose}
          stickToTop
        >
          <div
            ref={this.setPopoverInnerElement}
            className={styles.root}
          >

            <div
              className={title ? styles.filledArrow : styles.arrow}
              ref={this.setArrowElement}
              style={{
                left: `${arrowLeft}px`
              }}
            />
            <div
              className={styles.popover}
              style={{
                left: `${popoverLeft}px`
              }}
            >
              <button className={title ? styles.closeInverted : styles.close} type="button" onClick={onClose}>
                <CloseIcon />
              </button>

              {
                title && (
                  <h3 className={styles.title}>
                    {title}
                  </h3>
                )
              }

              <div
                ref={this.setContentElement}
                className={isResizing ? styles.contentIsResizing : styles.content}
                style={{
                  maxHeight: `${availableHeight}px`
                }}
                data-no-sticky-extra-padding
              >
                {children}
              </div>
              {
                actions.length > 0 && (
                  <div className={styles.functions}>
                    {
                      actions.map(action => {
                        return (
                          <Button
                            key={action.key}
                            onClick={action.handleClick}
                            kind={action.kind}
                            className={styles[`button_${action.kind}`] || styles.button}
                          >
                            {action.title}
                          </Button>
                        )
                      })
                    }
                  </div>
                )
              }
            </div>
          </div>
        </StickyPortal>
      </div>
    )
  }
}
