import React from 'react'
import RootComponent from 'part:@sanity/base/root'
import VersionChecker from './VersionChecker'

function SanityRoot() {
  return (
    <div>
      <RootComponent />
      <VersionChecker />
    </div>
  )
}

export default SanityRoot
