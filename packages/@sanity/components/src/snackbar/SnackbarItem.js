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
    actionTitle: null,
    autoDismissTimeout: 4000,
    children: null,
    icon: null,
    isPersisted: false,
    kind: 'info',
    offset: null,
    onAction: null,
    onDismiss: () => {},
    onHide: null,
    onSetHeight: () => {},
    setAutoFocus: false,
    transitionDuration: 200
  }

  snackIcon = () => {
    const {kind} = this.props
    if (kind === 'success') return <CheckCircleIcon />
    if (kind === 'warning') return <WarningIcon />
    if (kind === 'danger') return <DangerIcon />
    return <ErrorIcon />
  }

  handleAutoDismissSnack = () => {
    const {autoDismissTimeout, isPersisted, id, onDismiss, onHide} = this.props
    if (!isPersisted) {
      this._dismissTimer = setTimeout(() => {
        if (onHide) onHide()
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
    if (onAction) onAction()
    if (onHide) onHide()
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

    if (isPersisted) this.cancelAutoDismissSnack()
    else this.handleAutoDismissSnack()

    this._enterTimer = setTimeout(() => {
      this.setState({
        isEntering: false
      })
    }, 100)
  }

  componentWillUnmount() {
    clearTimeout(this._dismissTimer)
    clearTimeout(this._enterTimer)
  }

  render() {
    const {
      actionTitle,
      children,
      icon,
      id,
      isOpen,
      kind,
      message,
      offset,
      transitionDuration
    } = this.props

    const rootStyles = this.state.isEntering
      ? `${styles.root}`
      : `${styles.root} ${isOpen ? styles.showSnack : styles.dismissSnack}`
    const innerStyles = `${styles.inner} ${styles[kind]}`
    const transition = `all ${transitionDuration}ms ease-in-out`
    const role = () => {
      if (kind === 'success') return 'status'
      if (kind === 'info') return 'log'
      return 'alert'
    }
    return (
      <div
        aria-label={kind}
        aria-describedby={`snackbarMessage-${kind}-${id}`}
        role={role()}
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
          <div role="img" aria-hidden className={styles.snackbarIcon}>
            {icon ? icon : this.snackIcon(kind)}
          </div>
          <div className={styles.snackbarContent}>
            <div id={`snackbarMessage-${kind}-${id}`} style={children && {fontWeight: 'bold'}}>
              {message}
            </div>
            {children && <div className={styles.snackbarChildren}>{children}</div>}
          </div>
          <button
            aria-label={!actionTitle && 'Close'}
            className={styles.snackbarButton}
            onClick={() => this.handleAction()}
          >
            {actionTitle ? actionTitle : <CloseIcon />}
          </button>
        </div>
      </div>
    )
  }
}
