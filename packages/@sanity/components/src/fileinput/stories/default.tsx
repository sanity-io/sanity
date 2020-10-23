import React from 'react'
import FileInput from 'part:@sanity/components/fileinput/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const centerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
}

export function DefaultStory() {
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/fileinput/default" propTables={[FileInput]}>
        <FileInput onSelect={action('onSelect')}>
          All this content triggers a file select from device
        </FileInput>
      </Sanity>
    </div>
  )
}
