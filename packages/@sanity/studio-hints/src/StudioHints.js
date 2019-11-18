/* eslint-disable react/no-multi-comp */
import React from 'react'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config?'
import ToggleSidecarButton from './components/ToggleSidecarButton'
import HintsPackage from './components/HintsPackage'
import styles from './StudioHints.css'

export const isSidecarEnabled = () => !!studioHintsConfig

export function SidecarLayout() {
  return (
    <div className={styles.root}>
      <HintsPackage />
    </div>
  )
}

export function SidecarToggleButton() {
  return <ToggleSidecarButton />
}
