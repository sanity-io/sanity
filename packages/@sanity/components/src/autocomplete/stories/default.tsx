import Autocomplete from 'part:@sanity/components/autocomplete/default'
import {action} from 'part:@sanity/storybook'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  return (
    <CenteredContainer>
      <form style={{width: '100%', maxWidth: '30em'}}>
        <Autocomplete
          placeholder="Type to autocomplete…"
          label="Autocomplete"
          onChange={action('onChange')}
          suggestions={[]}
        />
      </form>
    </CenteredContainer>
  )
}
