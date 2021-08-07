// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {useLayer} from '@sanity/ui'
import React, {useMemo} from 'react'
import CheckCircleIcon from 'part:@sanity/base/circle-check-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import InfoIcon from 'part:@sanity/base/info-icon'
import classNames from 'classnames'
import {LegacyLayerProvider} from '../../../../components'
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

function PanePopoverDialog(props: PanePopoverProps) {
  return (
    <LegacyLayerProvider zOffset="portal">
      <PanePopoverDialogChildren {...props} />
    </LegacyLayerProvider>
  )
}

function PanePopoverDialogChildren(props: PanePopoverProps) {
  const {children, icon, id, kind = 'info', title, subtitle} = props
  const {zIndex} = useLayer()

  const iconNode = useMemo(() => {
    if (kind && typeof icon === 'boolean' && icon) return DEFAULT_ICONS[kind]
    if (typeof icon === 'object') return icon
    return undefined
  }, [icon, kind])

  return (
    <div
      aria-label={kind}
      aria-describedby={`popoverTitle-${kind}-${id}`}
      className={classNames(styles.root, styles.dialog)}
      data-kind={kind}
      style={{zIndex}}
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
    </div>
  )
}

export default PanePopoverDialog
