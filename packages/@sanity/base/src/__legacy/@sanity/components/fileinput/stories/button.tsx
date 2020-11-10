import React from 'react'
import {action} from 'part:@sanity/storybook/addons/actions'
import FileInputButton from 'part:@sanity/components/fileinput/button'
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

export function ButtonStory() {
  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/fileinput/button" propTables={[FileInputButton]}>
        <FileInputButton onSelect={action('onSelect')}>Upload file…</FileInputButton>
      </Sanity>
    </div>
  )
}
