import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, text, boolean} from 'part:@sanity/storybook/addons/knobs'

import FileInput from 'part:@sanity/components/fileinput/default'
import DropZone from 'part:@sanity/components/fileinput/dropzone'

storiesOf('File Input')
.addDecorator(withKnobs)
.add(
  'Default',
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

.add(
  'Drop zone',
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
        <DropZone
          onDrop={action('onDrop')}
          multiple={boolean('multiple', false)}
          ghost={boolean('ghost', false)}
          accept={text('accept', 'image/png')}
        />
      </div>
    )
  },
  {
    propTables: [DropZone],
    role: 'part:@sanity/components/fileinput/dropzone'
  }
)
