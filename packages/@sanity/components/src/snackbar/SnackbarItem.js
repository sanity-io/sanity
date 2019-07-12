import React from 'react'
import PropTypes from 'prop-types'
import CloseIcon from 'part:@sanity/base/close-icon'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import ErrorIcon from 'part:@sanity/base/error-icon'
import DangerIcon from 'part:@sanity/base/danger-icon'
import {Portal} from '../utilities/Portal'
import styles from './styles/SnackbarItem.css'

export default class SnackbarItem extends React.Component {
  static propTypes = {
    actionTitle: PropTypes.string,
    autoDismissTimeout: PropTypes.number,
    children: PropTypes.node,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    isOpen: PropTypes.bool.isRequired,
    isPersisted: PropTypes.bool,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    kind: PropTypes.oneOf(['danger', 'info', 'warning', 'error', 'success']),
    onAction: PropTypes.func,
    onDismiss: PropTypes.func,
    offset: PropTypes.number,
    onHide: PropTypes.func,
    onSetHeight: PropTypes.func.isRequired,
    setFocus: PropTypes.bool,
    tabIndex: PropTypes.number.isRequired,
    transitionDuration: PropTypes.number.isRequired
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      kind: 'info',
      isEntering: true,
      isPersisted: false,
      autoDismissTimeout: 4000
    }
    this._snackRef = React.createRef()
  }

  snackIcon = () => {
    const {kind} = this.props
    // eslint-disable-next-line no-nested-ternary
    return kind === 'success' ? (
      <CheckCircleIcon />
    ) : kind === 'warning' ? (
      <WarningIcon />
    ) : kind === 'danger' ? (
      <DangerIcon />
    ) : (
      <ErrorIcon />
    )
  }

  handleAutoDismissSnack = () => {
    const {autoDismissTimeout, isPersisted, id, onDismiss, onHide} = this.props
    if (!isPersisted) {
      this._dismissTimer = setTimeout(() => {
        if (onHide) {
          onHide()
        }
        onDismiss(id)
      }, autoDismissTimeout)
    }
  }

  handleMouseOver = () => {
    this.cancelAutoDismissSnack()
  }

  handleMouseLeave = () => {
    const {isPersisted} = this.props
    if (!isPersisted) {
      this.handleAutoDismissSnack()
    }
  }

  handleAction = () => {
    const {id, onAction, onDismiss, onHide} = this.props
    if (onAction) {
      onAction()
      return onDismiss(id)
    }
    if (onHide) {
      onHide()
      return onDismiss(id)
    }
    return onDismiss(id)
  }

  cancelAutoDismissSnack = () => {
    clearTimeout(this._dismissTimer)
  }

  componentDidMount() {
    const {onSetHeight, id, isPersisted, setFocus} = this.props

    if (setFocus) {
      this._snackRef.current.focus()
    }

    const height = this._snackRef.current && this._snackRef.current.clientHeight
    onSetHeight(id, height)

    isPersisted ? this.cancelAutoDismissSnack() : this.handleAutoDismissSnack()

    if (setFocus) {
      this.cancelAutoDismissSnack()
    }

    setTimeout(() => {
      this.setState({
        isEntering: false
      })
    }, 100)
  }

  render() {
    const {
      actionTitle,
      children,
      icon,
      isOpen,
      kind,
      message,
      offset,
      tabIndex,
      transitionDuration
    } = this.props

    const rootStyles = this.state.isEntering
      ? `${styles.root}`
      : `${styles.root} ${isOpen ? styles.ShowSnack : styles.DismissSnack}`
    const innerStyles = `${styles.inner} ${styles[kind]}`
    const transition = `all ${transitionDuration}ms ease-in-out`

    return (
      <Portal>
        <div
          role="alert"
          aria-label={kind}
          aria-describedby="SnackbarMessage"
          aria-live="alert"
          tabIndex={tabIndex}
          ref={this._snackRef}
          className={rootStyles}
          style={{bottom: offset, transition: transition}}
          onMouseOver={() => this.handleMouseOver()}
          onMouseLeave={() => this.handleMouseLeave()}
          onFocus={() => this.handleMouseOver()}
          onBlur={() => this.handleMouseLeave()}
        >
          <div className={innerStyles}>
            <div role="img" aria-label={kind} className={styles.SnackbarIcon}>
              {icon ? icon : this.snackIcon(kind)}
            </div>
            <div className={styles.SnackbarContent}>
              <div
                id="SnackbarMessage"
                className={styles.SnackbarMessage}
                style={children && {fontWeight: 'bold'}}
              >
                {message}
              </div>
              {children && <div className={styles.SnackbarChildren}>{children}</div>}
            </div>
            <button
              aria-label="Close"
              className={styles.SnackbarButton}
              onClick={() => this.handleAction()}
            >
              {actionTitle ? actionTitle : <CloseIcon />}
            </button>
          </div>
        </div>
      </Portal>
    )
  }
}
