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
    </div>
  )
}

export default {
  HintsCard: HintsCard,
  StudioHintsLayout: StudioHintsLayout
}
