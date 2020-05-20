import React from 'react'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import SearchField from '../navbar/search/SearchField'
import SearchResults from '../navbar/search/SearchResults'

export function SearchFieldMobileStory() {
  const hasResults = boolean('hasResults', false, 'props')
  const items = hasResults ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] : []
  const query = text('query', '', 'props')

  return (
    <div style={{background: '#444', height: '100vh'}}>
      <div style={{background: '#fff', margin: '0 auto', position: 'relative'}}>
        <SearchField
          isBleeding
          isFocused={boolean('isFocused', false, 'props')}
          isOpen={boolean('isOpen', false, 'props')}
          results={
            <SearchResults
              activeIndex={number('activeIndex', -1, 'props')}
              isLoading={boolean('isLoading', false, 'props')}
              items={items}
              query={query}
              renderItem={key => (
                <div key={key} style={{padding: '0.75em 1em'}}>
                  {key}
                </div>
              )}
            />
          }
          value={query}
          onChange={() => action('onChange')}
        />
      </div>
    </div>
  )
}
