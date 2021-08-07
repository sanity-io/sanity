// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {Portal, useLayer} from '@sanity/ui'
import classNames from 'classnames'
import CloseIcon from 'part:@sanity/base/close-icon'
import React from 'react'
import {LegacyLayerProvider} from '../../../../components'

import styles from './FullscreenMessageDialog.css'

interface Props {
  buttons?: React.ReactNode
  children: React.ReactNode
  color?: 'info' | 'success' | 'warning' | 'danger'
  onClose?: () => void
  title: React.ReactNode
}

function FullscreenMessageDialog(props: Props) {
  return (
    <Portal>
      <LegacyLayerProvider zOffset="portal">
        <FullscreenMessageDialogChildren {...props} />
      </LegacyLayerProvider>
    </Portal>
  )
}

function FullscreenMessageDialogChildren(props: Props) {
  const {zIndex} = useLayer()
  const className = classNames(styles.root, props.color && styles[`color_${props.color}`])

  return (
    <div className={className} style={{zIndex}}>
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
    </div>
  )
}

export default FullscreenMessageDialog
