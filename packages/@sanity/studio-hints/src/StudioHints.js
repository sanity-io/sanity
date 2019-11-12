<<<<<<< HEAD
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
=======
import React from 'react'
import studioHintsConfig from 'part:@sanity/studio-hints/config?'
import HintsPackage from './components/HintsPackage'
import HintsCard from './components/HintsCard'

const styles = {}

function StudioHintsLayout() {
  if (!studioHintsConfig) {
    return null
  }

  const slug = studioHintsConfig.hintsPackageSlug

  return (
    <div className={styles.root}>
      <HintsPackage slug={slug} />
>>>>>>> f1c01c628... [studio-hints] Attempt at rendering hints
    </div>
  )
}

<<<<<<< HEAD
export const SidecarToggleButton = () => {
  return <ToggleSidecarButton />
=======
export default {
  HintsCard: HintsCard,
  StudioHintsLayout: StudioHintsLayout
>>>>>>> f1c01c628... [studio-hints] Attempt at rendering hints
}
