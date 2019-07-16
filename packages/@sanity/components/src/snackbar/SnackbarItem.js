import React from 'react'
import PropTypes from 'prop-types'
import CloseIcon from 'part:@sanity/base/close-icon'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import ErrorIcon from 'part:@sanity/base/error-icon'
import DangerIcon from 'part:@sanity/base/danger-icon'
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
    message: PropTypes.string.isRequired,
    onAction: PropTypes.func,
    onDismiss: PropTypes.func,
    offset: PropTypes.number,
    onHide: PropTypes.func,
    onSetHeight: PropTypes.func,
    setAutoFocus: PropTypes.bool,
    transitionDuration: PropTypes.number
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      isEntering: true
    }
    this._snackRef = React.createRef()
  }

  static defaultProps = {
    kind: 'info',
    isPersisted: false,
    icon: null,
    children: null,
    offset: null,
    actionTitle: null,
    autoDismissTimeout: 4000,
    transitionDuration: 200,
    setAutoFocus: false,
    onAction: () => {},
    onDismiss: () => {},
    onHide: () => {},
    onSetHeight: () => {}
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
    const {onSetHeight, id, isPersisted, setAutoFocus} = this.props

    if (setAutoFocus) {
      this._snackRef.current.focus()
      this.cancelAutoDismissSnack()
    }

    const height = this._snackRef.current && this._snackRef.current.clientHeight
    onSetHeight(id, height)

    isPersisted ? this.cancelAutoDismissSnack() : this.handleAutoDismissSnack()

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
      transitionDuration
    } = this.props

    const rootStyles = this.state.isEntering
      ? `${styles.root}`
      : `${styles.root} ${isOpen ? styles.ShowSnack : styles.DismissSnack}`
    const innerStyles = `${styles.inner} ${styles[kind]}`
    const transition = `all ${transitionDuration}ms ease-in-out`
    const role = snackKind => {
      return snackKind === 'success' ? 'status' : snackKind === 'info' ? 'log' : 'alert'
    }
    return (
      <div
        aria-label={kind}
        aria-describedby="SnackbarMessage"
        role={role(kind)}
        ref={this._snackRef}
        tabIndex="0"
        className={rootStyles}
        style={{bottom: offset, transition: transition}}
        onMouseOver={() => this.handleMouseOver()}
        onMouseLeave={() => this.handleMouseLeave()}
        onFocus={() => this.handleMouseOver()}
        onBlur={() => this.handleMouseLeave()}
        onKeyDown={e => e.keyCode === 27 && this.handleAction()}
      >
        <div className={innerStyles}>
          <div role="img" aria-hidden className={styles.SnackbarIcon}>
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
            aria-label={!actionTitle && 'Close'}
            className={styles.SnackbarButton}
            onClick={() => this.handleAction()}
          >
            {actionTitle ? actionTitle : <CloseIcon />}
          </button>
        </div>
      </div>
    )
  }
}
