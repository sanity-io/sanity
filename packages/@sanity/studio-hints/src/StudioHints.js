import React from 'react'
import studioHintsConfig from 'part:@sanity/studio-hints/config?'
import HintsPackage from './components/HintsPackage'
import HintCard from './components/HintCard'
import styles from './StudioHints.css'

function StudioHintsLayout() {
  if (!studioHintsConfig) {
    return null
  }

  return (
    <div className={styles.root}>
      <HintsPackage />
    </div>
  )
}

export default {
  HintCard: HintCard,
  StudioHintsLayout: StudioHintsLayout
}
