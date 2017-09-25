import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/popover-style'
import Button from 'part:@sanity/components/buttons/default'
import CloseIcon from 'part:@sanity/base/close-icon'
import StickyPortal from 'part:@sanity/components/portal/sticky'
import tryFindScrollContainer from '../utilities/tryFindScrollContainer'

const popOverStack = []
const PADDING = 10

function setFocus(focusedPopOver) {
  popOverStack.forEach(popOver => {
    popOver.setState({isFocused: popOver === focusedPopOver})
  })
}

export default class EditItemPopOver extends React.Component {

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
  };

  static defaultProps = {
    title: undefined,
    scrollContainer: undefined,
    onClose() {}, // eslint-disable-line
    actions: [],
    isOpen: true
  }

  state = {
    isFocused: true,
    arrowLeft: 0,
    popoverLeft: 0,
    scrollContainer: undefined
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
    const {
      scrollContainer
    } = this.props

    if (!this._rootElement) {
      // console.error('no root element')
    }

    if (scrollContainer) {
      this.setScrollContainerElement(scrollContainer)
    } else {
      tryFindScrollContainer(this._rootElement, this.setScrollContainerElement)
    }
    window.addEventListener('keydown', this.handleKeyDown)
  }

  setScrollContainerElement = element => {
    this.setState({
      scrollContainer: element
    })
  }

  componentWillUnmount() {
    popOverStack.pop()
    const prevPopOver = popOverStack.slice(-1)[0]
    if (prevPopOver) {
      setFocus(prevPopOver)
      // prevPopOver.moveIntoPosition()
    }
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  handleClose = () => {
    if (!this.state.isFocused) {
      return
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
      availableWidth
    } = dimensions

    const width = this._popOverInnerElement.offsetWidth

    let popoverLeft = rootLeft - (width / 2)

    if (availableWidth < (rootLeft + (width / 2))) {
      popoverLeft = availableWidth - width - PADDING
    }

    this.setState({
      popoverLeft: popoverLeft,
      availableHeight: availableHeight,
      arrowLeft: rootLeft,
    })
  }

  render() {
    const {
      title,
      children,
      actions,
      isOpen,
    } = this.props


    const {
      popoverLeft,
      arrowLeft,
      availableHeight,
      scrollContainer
    } = this.state

    return (
      <div style={{display: 'span'}} ref={this.setRootElement}>
        <StickyPortal
          isOpen={isOpen}
          scrollContainer={scrollContainer}
          onResize={this.handlePortalResize}
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
              <button className={styles.close} type="button" onClick={this.handleClose}>
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
                className={styles.content}
                style={{
                  maxHeight: `${availableHeight - 16}px`
                }}
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
