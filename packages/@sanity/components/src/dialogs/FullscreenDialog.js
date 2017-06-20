import PropTypes from 'prop-types'
import React from 'react'

import styles from 'part:@sanity/components/dialogs/fullscreen-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import Portal from 'react-portal'
import Button from 'part:@sanity/components/buttons/default'

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
      index: PropTypes.string.isRequired,
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

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  handleKeyDown = event => {
    if (event.key === 'Escape' && this.isClosable()) {
      this.props.onClose()
    }
  }

  handleActionClick = event => {
    const actionIndex = event.currentTarget.getAttribute('data-action-index')
    this.props.onAction(this.props.actions[actionIndex])
  }

  isClosable() {
    return typeof this.props.onClose === 'function'
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
      <Portal closeOnEsc={this.isClosable()} isOpened={isOpen}>
        <div className={classNames}>
          {
            onClose && (
              <button className={styles.closeButton} onClick={onClose}>
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
                  actions.length > 0 && <div className={styles.functions}>
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
                }
              </div>
            </div>
          </div>
        </div>
      </Portal>
    )
  }
}
