import FileInputButton from 'part:@sanity/components/fileinput/button'
import {action} from 'part:@sanity/storybook/addons/actions'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function FileInputStory() {
  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/fileinput/button" propTables={[FileInputButton]}>
        <FileInputButton onSelect={action('onSelect')}>Upload file…</FileInputButton>
      </Sanity>
    </CenteredContainer>
  )
}
