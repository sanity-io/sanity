import {env} from 'node:process'

import {documentEventHandler} from '@sanity/functions'
import {algoliasearch} from 'algoliasearch'

const {ALGOLIA_APP_ID = '', ALGOLIA_WRITE_KEY = ''} = env

export const handler = documentEventHandler(async ({event}) => {
  const {_id, title, hideFromSearch} = event.data

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY)

  try {
    // We are assuming you already have an algolia instance setup with an index called 'posts'
    // addOrUpdateObject documentation: https://www.algolia.com/doc/libraries/javascript/v5/methods/search/add-or-update-object/?client=javascript
    await algolia.addOrUpdateObject({
      indexName: 'posts',
      objectID: _id,
      body: {
        title,
        hideFromSearch, // This is an optional field that you can use to hide a document from search results
      },
    })

    // eslint-disable-next-line no-console
    console.log(`Successfully synced document ${_id} ("${title}") to Algolia`)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error syncing to Algolia:', error)
    throw error
  }
})
