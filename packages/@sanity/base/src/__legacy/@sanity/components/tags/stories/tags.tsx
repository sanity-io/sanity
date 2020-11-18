import TagsTextField from 'part:@sanity/components/tags/textfield'
import {action} from 'part:@sanity/storybook/addons/actions'
import {array, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import React from 'react'

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

export function TagsStory() {
  const tags = ['Test', 'Sanity']

  return (
    <div style={centerStyle}>
      <Sanity part="part:@sanity/components/tags/textfield" propTables={[TagsTextField]}>
        <TagsTextField
          label={text('label', 'Tags', 'props')}
          readOnly={boolean('readOnly', false, 'props')}
          placeholder={text('placeholder', 'This is the placeholder', 'props')}
          value={array('value', tags, 'props')}
          onChange={action('onChange')}
        />
      </Sanity>
    </div>
  )
}
