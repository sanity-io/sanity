import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs, text, boolean} from 'part:@sanity/storybook/addons/knobs'

import FileInput from 'part:@sanity/components/fileinput/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import DropZone from 'part:@sanity/components/fileinput/dropzone'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('File Input')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    return (
      <Sanity part="part:@sanity/components/fileinput/default" propTables={[FileInput]}>
        <FileInput onSelect={action('onSelect')}>
          All this content triggers a file select from device
        </FileInput>
      </Sanity>
    )
  }
)
.add(
  'Button',
  () => {
    return (
      <Sanity part="part:@sanity/components/fileinput/button" propTables={[FileInputButton]}>
        <FileInputButton onSelect={action('onSelect')}>
          Upload file…
        </FileInputButton>
      </Sanity>
    )
  }
)
.add(
  'Drop zone',
  () => {
    return (
      <Sanity part="part:@sanity/components/fileinput/dropzone" propTables={[DropZone]}>
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
      </Sanity>
    )
  }
)
