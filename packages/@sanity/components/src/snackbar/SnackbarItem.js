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
    offset: PropTypes.number,
    transitionDuration: PropTypes.number.isRequired,
    snack: PropTypes.shape({
      message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      kind: PropTypes.oneOf(['danger', 'info', 'warning', 'error', 'success']).isRequired,
      icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      isPersisted: PropTypes.bool,
      isOpen: PropTypes.bool.isRequired,
      onAction: PropTypes.func,
      actionTitle: PropTypes.string,
      onHide: PropTypes.func,
      children: PropTypes.node,
      setFocus: PropTypes.bool,
      autoDismissTimeout: PropTypes.number
    }).isRequired,
    onDismiss: PropTypes.func.isRequired,
    onSetHeight: PropTypes.func.isRequired,
    tabIndex: PropTypes.number.isRequired
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      isEntering: true
    }
    this._snackRef = React.createRef()
  }

  snackIcon = () => {
    const {snack} = this.props
    // eslint-disable-next-line no-nested-ternary
    return snack.kind === 'success' ? (
      <CheckCircleIcon />
    ) : snack.kind === 'warning' ? (
      <WarningIcon />
    ) : snack.kind === 'danger' ? (
      <DangerIcon />
    ) : (
      <ErrorIcon />
    )
  }

  handleAutoDismissSnack = () => {
    const {snack, onDismiss} = this.props
    const autoDismissTimeout = snack.autoDismissTimeout ? snack.autoDismissTimeout : 4000
    if (!snack.isPersisted) {
      this._dismissTimer = setTimeout(() => {
        if (snack.onHide) {
          snack.onHide()
        }
        onDismiss(snack.key)
      }, autoDismissTimeout)
    }
  }

  handleMouseOver = () => {
    this.cancelAutoDismissSnack()
  }

  handleMouseLeave = () => {
    const {snack} = this.props
    if (!snack.isPersisted) {
      this.handleAutoDismissSnack()
    }
  }

  handleAction = () => {
    const {snack, onDismiss} = this.props
    if (snack.onAction) {
      snack.onAction()
      return onDismiss(snack.key)
    }
    if (snack.onHide) {
      snack.onHide()
      return onDismiss(snack.key)
    }
    return onDismiss(snack.key)
  }

  cancelAutoDismissSnack = () => {
    clearTimeout(this._dismissTimer)
  }

  componentDidMount() {
    const {onSetHeight, snack} = this.props

    if (snack.setFocus) {
      this._snackRef.current.focus()
    }

    const height = this._snackRef.current && this._snackRef.current.clientHeight
    onSetHeight(snack.key, height)

    snack.isPersisted ? this.cancelAutoDismissSnack() : this.handleAutoDismissSnack()

    if (snack.setFocus) {
      this.cancelAutoDismissSnack()
    }

    setTimeout(() => {
      this.setState({
        isEntering: false
      })
    }, 100)
  }

  render() {
    const {snack, offset, transitionDuration, tabIndex} = this.props

    const rootStyles = this.state.isEntering
      ? `${styles.root}`
      : `${styles.root} ${snack.isOpen ? styles.ShowSnack : styles.DismissSnack}`
    const innerStyles = `${styles.inner} ${styles[snack.kind]}`
    const transition = `all ${transitionDuration}ms ease-in-out`

    return (
      <Portal>
        <div
          role="alert"
          aria-label={snack.kind}
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
            <div role="img" aria-label={snack.kind} className={styles.SnackbarIcon}>
              {snack.icon ? snack.icon : this.snackIcon(snack.kind)}
            </div>
            <div className={styles.SnackbarContent}>
              <div
                id="SnackbarMessage"
                className={styles.SnackbarMessage}
                style={snack.children && {fontWeight: 'bold'}}
              >
                {snack.message}
              </div>
              {snack.children && <div className={styles.SnackbarChildren}>{snack.children}</div>}
            </div>
            <button
              aria-label="Close"
              className={styles.SnackbarButton}
              onClick={() => this.handleAction()}
            >
              {snack.actionTitle ? snack.actionTitle : <CloseIcon />}
            </button>
          </div>
        </div>
      </Portal>
    )
  }
}
