import Chance from 'chance'
import {range} from 'lodash'
import Autocomplete from 'part:@sanity/components/autocomplete/default'
import {action} from 'part:@sanity/storybook'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

const chance = new Chance()

export function DefaultWithSuggestionsStory() {
  const suggestions = range(10).map((item, i) => {
    return {
      id: `${i}`,
      title: chance.name(),
    }
  })

  return (
    <CenteredContainer>
      <form style={{width: '100%', maxWidth: '30em'}}>
        <Autocomplete
          value="One"
          suggestions={suggestions}
          // isOpen
          label="Autocomplete component"
          onChange={action('onChange')}
        />
      </form>
    </CenteredContainer>
  )
}
