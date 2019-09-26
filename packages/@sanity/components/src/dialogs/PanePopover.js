/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import ErrorIcon from 'part:@sanity/base/error-icon'
import InfoIcon from 'part:@sanity/base/info-icon'
import classNames from 'classnames'
import styles from './styles/PanePopover.css'

export default class PanePopover extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.bool]),
    kind: PropTypes.oneOf(['info', 'warning', 'error', 'success', 'neutral']),
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  }

  static defaultProps = {
    children: null,
    icon: null,
    kind: 'info',
    title: 'Pane Popover',
    subtitle: 'Popover content'
  }

  DEFAULT_ICONS = {
    info: <InfoIcon />,
    success: <CheckCircleIcon />,
    warning: <WarningIcon />,
    error: <WarningIcon />
  }

  snackIcon = () => {
    const {icon, kind} = this.props
    if (typeof icon === 'boolean' && icon) return this.DEFAULT_ICONS[kind]
    if (typeof icon === 'object' || typeof icon === 'string') return icon
    return undefined
  }

  render() {
    const {children, icon, id, kind, title, subtitle} = this.props

    const role = () => {
      if (kind === 'success') return 'status'
      if (kind === 'info') return 'log'
      return 'alert'
    }
    return (
      <div
        aria-label={kind}
        aria-describedby={`snackbarTitle-${kind}-${id}`}
        className={classNames([styles.root, styles.dialog])}
        data-kind={kind}
      >
        <div className={styles.inner}>
          <div className={styles.content}>
            <div id={`snackbarTitle-${kind}-${id}`} className={styles.title}>
              {icon && (
                <div role="img" aria-hidden className={styles.icon}>
                  {this.snackIcon()}
                </div>
              )}
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
