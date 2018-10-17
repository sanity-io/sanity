import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import brandColors from 'part:@sanity/base/theme/variables/brand-colors-style'

storiesOf('Variables').add('Brand colors', () => {
  console.log(brandColors)
  return (
    <div>
      Test
    </div>
  )
})
