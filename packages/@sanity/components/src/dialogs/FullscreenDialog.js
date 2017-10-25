import PropTypes from 'prop-types'
import React from 'react'

import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import Portal from 'react-portal'
import Button from 'part:@sanity/components/buttons/default'
import LayerStack from 'part:@sanity/components/layer-stack'

export default class FullScreenDialog extends React.PureComponent {
  static propTypes = {
    color: PropTypes.oneOf(['default', 'warning', 'info', 'success', 'danger']),
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    centered: PropTypes.bool,
    onAction: PropTypes.func,
    actions: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      tooltip: PropTypes.string,
      kind: PropTypes.string,
      autoFocus: PropTypes.bool
    }))
  }

  static defaultProps = {
    color: 'default',
    isOpen: false,
    showHeader: false,
    onAction() {},
    onOpen() {},
    actions: []
  }

  state = {
    isFocused: true
  }

  componentWillMount() {
    LayerStack.addLayer(this)
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, false)
    LayerStack.removeLayer()
  }

  handleKeyDown = event => {
    if (event.key === 'Escape' && this.isClosable()) {
      this.handleClose()
    }
  }

  handleActionClick = event => {
    const actionIndex = event.currentTarget.getAttribute('data-action-index')
    this.props.onAction(this.props.actions[actionIndex])
  }

  isClosable() {
    return typeof this.props.onClose === 'function'
  }

  handleClose = event => {
    if (!this.state.isFocused) {
      return
    }
    this.props.onClose()
  }

  render() {
    const {color, title, className, onClose, centered, isOpen, actions} = this.props

    const classNames = [
      styles[color] || styles.default,
      isOpen ? styles.isOpen : styles.isClosed,
      className,
      centered && styles.centered
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <Portal isOpened={isOpen}>
        <div className={classNames}>
          {
            onClose && (
              <button className={styles.closeButton} onClick={this.handleClose}>
                <CloseIcon color="inherit" />
              </button>
            )
          }
          <div className={styles.inner}>
            <h1 className={styles.heading}>{title}</h1>
            <div className={styles.content}>
              {this.props.children}
              <div className={styles.actions}>
                {
                  actions.length > 0 && (
                    <div className={styles.functions}>
                      {
                        actions.map((action, i) => {
                          return (
                            <Button
                              key={i}
                              onClick={this.handleActionClick}
                              data-action-index={i}
                              color={color === 'default' ? action.color : 'white'}
                              disabled={action.disabled}
                              inverted={!action.secondary}
                              kind={action.kind}
                              autoFocus={action.autoFocus}
                              className={`
                                ${styles.button}
                                ${styles[`button_${action.kind}`] || styles.button}
                              `
                              }
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
          </div>
        </div>
      </Portal>
    )
  }
}
