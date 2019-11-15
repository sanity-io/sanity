/* eslint-disable react/no-multi-comp */
import React from 'react'
import ToggleSidecarButton from './components/ToggleSidecarButton'
import HintsPackage from './components/HintsPackage'
import styles from './StudioHints.css'

export function SidecarLayout() {
  return (
    <div className={styles.root}>
      <HintsPackage />
    </div>
  )
}

export function SidecarToggleButtonIcon() {
  return <ToggleSidecarButton />
}
