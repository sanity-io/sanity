import React from 'react'
import studioHintsConfig from 'part:@sanity/studio-hints/config?'
import HintsPackage from './components/HintsPackage'

const styles = {}

function StudioHints() {
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

export default StudioHints
