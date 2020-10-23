import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import ErrorIcon from 'part:@sanity/base/error-icon'
import InfoIcon from 'part:@sanity/base/info-icon'
import Button from 'part:@sanity/components/buttons/default'
import styles from './SnackbarItem.css'
import {SnackbarAction} from './types'

export interface SnackbarItemProps {
  action?: SnackbarAction
  autoDismissTimeout?: number
  children?: React.ReactNode
  icon?: boolean
  isCloseable?: boolean
  isOpen?: boolean
  isPersisted?: boolean
  id: string | number
  kind?: 'info' | 'warning' | 'error' | 'success'
  title?: string | React.ReactNode
  subtitle?: string | React.ReactNode
  onDismiss: (id: string | number) => void
  offset?: number
  onClose?: () => void
  onSetHeight: (id: number, height: number) => void
  setFocus: boolean
  setAutoFocus?: boolean
}

const DEFAULT_ICONS = {
  info: <InfoIcon />,
  success: <CheckCircleIcon />,
  warning: <WarningIcon />,
  error: <ErrorIcon />,
}

interface State {
  isEntering: boolean
}

export default class SnackbarItem extends React.Component<SnackbarItemProps> {
  _dismissTimer?: NodeJS.Timer
  _enterTimer?: NodeJS.Timer
  _snackRef: React.RefObject<HTMLDivElement> = React.createRef()

  state: State = {
    isEntering: true,
  }

  snackIcon = () => {
    const {icon, kind = 'info'} = this.props
    if (typeof icon === 'boolean' && icon) return DEFAULT_ICONS[kind]
    if (typeof icon === 'object' || typeof icon === 'string') return icon
    return undefined
  }

  handleAutoDismissSnack = () => {
    const {autoDismissTimeout = 5000, isPersisted, id, onDismiss, onClose} = this.props
    if (!isPersisted) {
      this._dismissTimer = setTimeout(() => {
        if (onClose) onClose()
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

  handleFocus = () => {
    this.cancelAutoDismissSnack()
  }

  handleBlur = () => {
    const {isPersisted} = this.props
    if (!isPersisted) {
      this.handleAutoDismissSnack()
    }
  }

  handleAction = () => {
    const {action, id, onDismiss} = this.props
    if (action && action.callback) action.callback()
    if (onDismiss) onDismiss(id)
  }

  handleClose = () => {
    const {id, onClose, onDismiss} = this.props
    if (onClose) onClose()
    if (onDismiss) onDismiss(id)
  }

  cancelAutoDismissSnack = () => {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer)
      this._dismissTimer = undefined
    }
  }

  componentDidMount() {
    const {onSetHeight, id, isPersisted, setAutoFocus} = this.props

    if (setAutoFocus) {
      if (this._snackRef.current) {
        this._snackRef.current.focus()
      }

      this.cancelAutoDismissSnack()
    }

    const height = this._snackRef.current && this._snackRef.current.clientHeight
    onSetHeight(id as any, height || 0)

    if (isPersisted) this.cancelAutoDismissSnack()
    else this.handleAutoDismissSnack()

    this._enterTimer = setTimeout(() => {
      this.setState({
        isEntering: false,
      })
    }, 100)
  }

  componentWillUnmount() {
    if (this._dismissTimer) {
      clearTimeout(this._dismissTimer)
      this._dismissTimer = undefined
    }

    if (this._enterTimer) {
      clearTimeout(this._enterTimer)
      this._enterTimer = undefined
    }
  }

  render() {
    const {
      action,
      children,
      icon,
      id,
      isCloseable = true,
      isOpen,
      kind = 'info',
      title,
      subtitle,
      offset,
    } = this.props

    const rootStyles = this.state.isEntering
      ? `${styles.root}`
      : `${styles.root} ${isOpen ? styles.showSnack : styles.dismissSnack}`
    const transition = `all 200ms ease-in-out`
    const role = () => {
      if (kind === 'success') return 'status'
      if (kind === 'info') return 'log'
      return 'alert'
    }
    return (
      <div
        aria-label={kind}
        aria-describedby={`snackbarTitle-${kind}-${id}`}
        role={role()}
        ref={this._snackRef}
        tabIndex={-1}
        className={rootStyles}
        style={{bottom: offset, transition: transition}}
        onMouseOver={() => this.handleMouseOver()}
        onMouseLeave={() => this.handleMouseLeave()}
        onFocus={() => this.handleFocus()}
        onBlur={() => this.handleBlur()}
        onKeyDown={(e) => e.key === 'escape' && this.handleAction()}
        data-kind={kind}
      >
        <div className={styles.inner}>
          <div className={styles.buttonsWrapper}>
            {action && (
              <div className={styles.actionButtonContainer}>
                <Button
                  onClick={() => this.handleAction()}
                  bleed
                  color="white"
                  kind="simple"
                  padding="none"
                >
                  {action.title}
                </Button>
              </div>
            )}
            {isCloseable && (
              <div className={styles.closeButtonContainer}>
                <Button
                  aria-label="Close"
                  onClick={this.handleClose}
                  bleed
                  color="white"
                  icon={CloseIcon}
                  kind="simple"
                  padding="none"
                />
              </div>
            )}
          </div>
          {icon && (
            <div role="img" aria-hidden className={styles.icon}>
              {this.snackIcon()}
            </div>
          )}
          <div className={styles.content}>
            <div id={`snackbarTitle-${kind}-${id}`} className={styles.title}>
              {title}
            </div>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            {children && <div className={styles.children}>{children}</div>}
          </div>
        </div>
      </div>
    )
  }
}
