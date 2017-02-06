import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'

import FileInput from 'part:@sanity/components/fileinput/default'
import DropZone from 'part:@sanity/components/fileinput/dropzone'

storiesOf('File Input')
.addWithInfo(
  'Default',
  `
    Default with text
  `,
  () => {
    return (
      <FileInput onSelect={action('onSelect')}>
        All this content triggers a file select from device
      </FileInput>
    )
  },
  {
    propTables: [FileInput],
    role: 'part:@sanity/components/fileinput/default'
  }
)

.addWithInfo(
  'Drop zone',
  `
    Drop zone
  `,
  () => {
    return (
      <div
        style={{
          position: 'absolute',
          width: '50vw',
          height: '50vh',
          transform: 'translate(50%, 50%)'
        }}
      >
        <DropZone onSelect={action('onSelect')} />
      </div>
    )
  },
  {
    propTables: [DropZone],
    role: 'part:@sanity/components/fileinput/dropzone'
  }
)
