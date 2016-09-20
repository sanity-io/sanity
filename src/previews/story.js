import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import DefaultPreview from 'part:@sanity/components/previews/default'

storiesOf('Previews')
  .addWithInfo(
  'Default',
  `
    Default label
  `,
  () => {
    return (
      <DefaultPreview
        title="This is the title"
        subtitle="Subtitle"
        description="This is the long the descriptions that should no be to long, beacuse we will cap it"
      />
    )
  },
  {
    propTables: [DefaultPreview],
    role: 'part:@sanity/components/labels/default'
  }
)
