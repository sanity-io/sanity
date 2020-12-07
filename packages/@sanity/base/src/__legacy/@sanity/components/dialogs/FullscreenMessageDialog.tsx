import {Layer} from '@sanity/ui'
import classNames from 'classnames'
import CloseIcon from 'part:@sanity/base/close-icon'
import React from 'react'
import {useZIndex} from '../../../../components'

import styles from './FullscreenMessageDialog.css'

interface Props {
  buttons?: React.ReactNode
  children: React.ReactNode
  color?: 'info' | 'success' | 'warning' | 'danger'
  onClose?: () => void
  title: React.ReactNode
}

function FullscreenMessageDialog(props: Props) {
  const zindex = useZIndex()
  const className = classNames(styles.root, props.color && styles[`color_${props.color}`])

  return (
    <Layer className={className} zOffset={zindex.portal}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>{props.title}</h2>
          {props.onClose && (
            <div className={styles.cardHeaderActions}>
              <button onClick={props.onClose} type="button">
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
        <div className={styles.cardContent}>{props.children}</div>
        {props.buttons && <div className={styles.cardButtons}>{props.buttons}</div>}
      </div>
    </Layer>
  )
}

export default FullscreenMessageDialog
