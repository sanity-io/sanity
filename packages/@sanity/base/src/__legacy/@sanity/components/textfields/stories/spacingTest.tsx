import DefaultTextField from 'part:@sanity/components/textfields/default'
import React from 'react'

export function SpacingTestStory() {
  return (
    <div style={{margin: '1rem'}}>
      <DefaultTextField label="Label" placeholder="Placeholder" />
      <DefaultTextField label="Label" placeholder="Placeholder" />
      <DefaultTextField label="Label" placeholder="Placeholder" />
      <DefaultTextField label="Label" placeholder="Placeholder" />
    </div>
  )
}
