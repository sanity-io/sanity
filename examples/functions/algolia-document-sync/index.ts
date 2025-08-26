import {env} from 'node:process'

import {documentEventHandler} from '@sanity/functions'
import {algoliasearch} from 'algoliasearch'

const {ALGOLIA_APP_ID = '', ALGOLIA_WRITE_KEY = ''} = env

// TODO: Allow this function to run on multiple indexes/post types (e.g. 'posts', 'products', 'events', etc.)
const ALGOLIA_INDEX_NAME = 'posts'

export const handler = documentEventHandler(async ({event}) => {
  const {_id, title, hideFromSearch, operation} = event.data

  const algolia = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY)
  if (operation === 'delete') {
    try {
      // We are assuming you already have an algolia instance setup with an index called 'posts'
      // addOrUpdateObject documentation: https://www.algolia.com/doc/libraries/javascript/v5/methods/search/delete-object/?client=javascript
      await algolia.deleteObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
      })

      console.log(`Successfully deleted document ${_id} ("${title}") from Algolia`)
    } catch (error) {
      console.error('Error syncing to Algolia:', error)
      throw error
    }
  } else {
    try {
      // We are assuming you already have an algolia instance setup with an index called 'posts'
      // addOrUpdateObject documentation: https://www.algolia.com/doc/libraries/javascript/v5/methods/search/add-or-update-object/?client=javascript
      await algolia.addOrUpdateObject({
        indexName: ALGOLIA_INDEX_NAME,
        objectID: _id,
        body: {
          title,
          hideFromSearch, // This is an optional field that you can use to hide a document from search results
        },
      })

      console.log(`Successfully synced document ${_id} ("${title}") to Algolia`)
    } catch (error) {
      console.error('Error syncing to Algolia:', error)
      throw error
    }
  }
})
