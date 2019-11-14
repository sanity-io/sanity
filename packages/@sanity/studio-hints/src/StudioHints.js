import React from 'react'
import HintsPackage from './components/HintsPackage'
import HintCard from './components/HintCard'
import styles from './StudioHints.css'

function StudioHintsLayout() {
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
