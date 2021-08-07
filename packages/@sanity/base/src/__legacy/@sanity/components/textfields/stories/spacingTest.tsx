// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

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
