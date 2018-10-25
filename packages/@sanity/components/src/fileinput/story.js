import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import {withKnobs} from 'part:@sanity/storybook/addons/knobs'

import FileInput from 'part:@sanity/components/fileinput/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0
}

storiesOf('File Input')
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/fileinput/default" propTables={[FileInput]}>
          <FileInput onSelect={action('onSelect')}>
            All this content triggers a file select from device
          </FileInput>
        </Sanity>
      </div>
    )
  })
  .add('Button', () => {
    return (
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/fileinput/button" propTables={[FileInputButton]}>
          <FileInputButton onSelect={action('onSelect')}>Upload file…</FileInputButton>
        </Sanity>
      </div>
    )
  })
