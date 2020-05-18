import React from 'react'
import {text, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import SearchField from '../components/SearchField'
import SearchResults from '../components/SearchResults'

import NavBarStyles from '../components/styles/NavBar.css'
import DefaultLayoutStyles from '../components/styles/DefaultLayout.css'

export function SearchFieldDesktopStory() {
  const hasResults = boolean('hasResults', false, 'props')
  const items = hasResults ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] : []
  const query = text('query', '', 'props')

  return (
    <div>
      <div className={DefaultLayoutStyles.navBar}>
        <div className={NavBarStyles.root}>
          <div className={NavBarStyles.search}>
            <SearchField
              hotkeys={['F']}
              isFocused={boolean('isFocused', false, 'props')}
              isOpen={boolean('isOpen', false, 'props')}
              results={
                <SearchResults
                  activeIndex={number('activeIndex', -1, 'props')}
                  isLoading={boolean('isLoading', false, 'props')}
                  items={items}
                  query={query}
                  renderItem={key => (
                    <div key={key} style={{padding: '0.5em 0.75em'}}>
                      {key}
                    </div>
                  )}
                />
              }
              value={query}
              onChange={() => console.log('change')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
