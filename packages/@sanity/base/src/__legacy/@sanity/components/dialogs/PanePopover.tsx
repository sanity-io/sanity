import {Layer} from '@sanity/ui'
import React from 'react'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import InfoIcon from 'part:@sanity/base/info-icon'
import classNames from 'classnames'
import {useZIndex} from '../../../../components'
import styles from './PanePopover.css'

interface PanePopoverProps {
  children?: React.ReactNode
  icon?: React.ReactNode | boolean
  kind?: 'info' | 'warning' | 'error' | 'success' | 'neutral'
  title: string | React.ReactNode
  subtitle?: string | React.ReactNode
  id: string | number
}

const DEFAULT_ICONS = {
  info: <InfoIcon />,
  success: <CheckCircleIcon />,
  warning: <WarningIcon />,
  error: <WarningIcon />,
}

const iconKind = (props: PanePopoverProps) => {
  const {icon, kind = 'info'} = props
  if (kind && typeof icon === 'boolean' && icon) return DEFAULT_ICONS[kind]
  if (typeof icon === 'object') return icon
  return undefined
}

export default function PanePopover(props: PanePopoverProps) {
  const zindex = useZIndex()
  const {children, icon, id, kind = 'info', title, subtitle} = props
  const iconNode = iconKind(props)

  return (
    <Layer
      aria-label={kind}
      aria-describedby={`popoverTitle-${kind}-${id}`}
      className={classNames(styles.root, styles.dialog)}
      data-kind={kind}
      zOffset={zindex.portal}
    >
      <div className={styles.inner}>
        <div className={styles.content}>
          <div id={`popoverTitle-${kind}-${id}`} className={styles.title}>
            {icon && (
              <div role="img" aria-hidden className={styles.icon}>
                {iconNode}
              </div>
            )}
            {title}
          </div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          {children && <div className={styles.children}>{children}</div>}
        </div>
      </div>
    </Layer>
  )
}
