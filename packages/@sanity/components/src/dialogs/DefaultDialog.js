import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import styles from 'part:@sanity/components/dialogs/default-style'
import Button from 'part:@sanity/components/buttons/default'
import Portal from 'react-portal'

export default class DefaultDialog extends React.Component {
  static propTypes = {
    kind: PropTypes.oneOf(['default', 'warning', 'success', 'danger', 'info']),
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
    onOpen: PropTypes.func,
    onClose: PropTypes.func,
    isOpen: PropTypes.bool,
    onAction: PropTypes.func,
    showHeader: PropTypes.bool,
    actions: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      tooltip: PropTypes.string,
      kind: PropTypes.string,
      autoFocus: PropTypes.bool
    }))
  }

  static defaultProps = {
    isOpen: false,
    showHeader: false,
    onAction() {},
    onOpen() {},
    actions: [],
    kind: 'default'
  }

  componentDidUpdate(prevProps) {
    const isOpen = this.props.isOpen
    const wasOpen = prevProps.isOpen
    if (!wasOpen && isOpen) {
      this.openDialogElement()
    } else if (wasOpen && !isOpen) {
      this.closeDialogElement()
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, false)
  }

  isClosable() {
    return typeof this.props.onClose === 'function'
  }

  handleKeyDown = event => {
    if (event.key === 'Escape' && this.isClosable()) {
      this.props.onClose()
    }
  }

  openDialogElement() {
    this.props.onOpen()
  }

  handleCloseClick = event => {
    this.props.onClose()
  }

  handleDialogClick = event => {
    event.stopPropagation()
  }

  handleActionClick = event => {
    const actionIndex = event.currentTarget.getAttribute('data-action-index')
    this.props.onAction(this.props.actions[actionIndex])
  }

  setDialogElement = element => {
    this.dialog = element
  }

  render() {
    const {title, actions, isOpen, showHeader, kind, onClose, className} = this.props
    const classNames = `
      ${styles[kind]}
      ${isOpen ? styles.isOpen : styles.isClosed}
      ${showHeader ? styles.hasHeader : ''}
      ${actions && actions.length > 0 ? styles.hasFunctions : ''}
      ${className}
    `

    return (
      <Portal isOpened={isOpen} onClose={onClose}>
        <div className={classNames} ref={this.setDialogElement} onClick={this.handleCloseClick}>
          <div className={styles.dialog} onClick={this.handleDialogClick}>
            {
              !showHeader && onClose && (
                <button className={styles.closeButtonOutside} onClick={this.handleCloseClick}>
                  <CloseIcon color="inherit" />
                </button>
              )
            }
            <div className={styles.inner}>
              {
                showHeader && onClose && (
                  <div className={styles.header}>
                    <h1 className={styles.title}>{title}</h1>
                    <button className={styles.closeButton} onClick={this.handleCloseClick}>
                      <CloseIcon color="inherit" />
                    </button>
                  </div>
                )
              }
              <div className={styles.content}>
                {this.props.children}
              </div>

              <div className={styles.footer}>
                {
                  actions.length > 0 && <div className={styles.functions}>
                    {
                      actions.map((action, i) => {
                        return (
                          <Button
                            key={i}
                            onClick={this.handleActionClick}
                            data-action-index={i}
                            color={action.color}
                            disabled={action.disabled}
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
