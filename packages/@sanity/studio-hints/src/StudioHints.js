/* eslint-disable react/no-multi-comp */
import React from 'react'
import studioHintsConfig from 'part:@sanity/default-layout/studio-hints-config?'
import ToggleSidecarButton from './components/ToggleSidecarButton'
import HintsPackage from './components/HintsPackage'
import styles from './StudioHints.css'

const isMobile = () => {
  return typeof window !== 'undefined' && window.innerWidth < 512
}

export const isSidecarEnabled = () => studioHintsConfig && !isMobile()

export const SidecarLayout = () => {
  return (
    <div className={styles.root}>
      <HintsPackage />
    </div>
  )
}

export const SidecarToggleButton = () => {
  return <ToggleSidecarButton />
}
