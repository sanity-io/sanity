import React from 'react'
import PropTypes from 'prop-types'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import InfoIcon from 'part:@sanity/base/info-icon'
import classNames from 'classnames'
import styles from './styles/PanePopover.css'

export default class PanePopover extends React.PureComponent {
  static propTypes = {
    children: PropTypes.node,
    icon: PropTypes.oneOfType([PropTypes.node, PropTypes.bool]),
    kind: PropTypes.oneOf(['info', 'warning', 'error', 'success', 'neutral']),
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  }

  static defaultProps = {
    children: null,
    icon: null,
    kind: 'info'
  }

  DEFAULT_ICONS = {
    info: <InfoIcon />,
    success: <CheckCircleIcon />,
    warning: <WarningIcon />,
    error: <WarningIcon />
  }

  iconKind = () => {
    const {icon, kind} = this.props
    if (typeof icon === 'boolean' && icon) return this.DEFAULT_ICONS[kind]
    if (typeof icon === 'object') return icon
    return undefined
  }

  render() {
    const {children, icon, id, kind, title, subtitle} = this.props
    const Icon = this.iconKind()

    return (
      <div
        aria-label={kind}
        aria-describedby={`popoverTitle-${kind}-${id}`}
        className={classNames([styles.root, styles.dialog])}
        data-kind={kind}
      >
        <div className={styles.inner}>
          <div className={styles.content}>
            <div id={`popoverTitle-${kind}-${id}`} className={styles.title}>
              {icon && (
                <div role="img" aria-hidden className={styles.icon}>
                  {Icon}
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
