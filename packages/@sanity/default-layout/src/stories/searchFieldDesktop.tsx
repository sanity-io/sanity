import React from 'react'
import {action} from 'part:@sanity/storybook/addons/actions'
import {text, boolean, number} from 'part:@sanity/storybook/addons/knobs'
import SearchField from '../navbar/search/SearchField'
import SearchResults from '../navbar/search/SearchResults'
import NavbarStyles from '../navbar/Navbar.css'
import DefaultLayoutStyles from '../DefaultLayout.css'

export function SearchFieldDesktopStory() {
  const hasResults = boolean('hasResults', false, 'props')
  const items: any[] = hasResults
    ? [
        {
          hit: {_id: 'foo', _type: 'foo'},
          score: 12,
          stories: {path: 'foo', score: 1, why: 'test'},
        },
      ]
    : []
  const query = text('query', '', 'props')

  return (
    <div>
      <div className={DefaultLayoutStyles.navBar}>
        <div className={NavbarStyles.root}>
          <div className={NavbarStyles.search}>
            <SearchField
              hotkeys={['F']}
              isFocused={boolean('isFocused', false, 'props')}
              isOpen={boolean('isOpen', false, 'props')}
              results={
                <SearchResults
                  activeIndex={number('activeIndex', -1, 'props')}
                  isBleeding={false}
                  isLoading={boolean('isLoading', false, 'props')}
                  items={items}
                  query={query}
                  renderItem={(key) => (
                    <div key={key.hit._id} style={{padding: '0.5em 0.75em'}}>
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
      </div>
    </div>
  )
}
