import {type DocumentEvent, documentEventHandler} from '@sanity/functions'
import { algoliasearch } from "algoliasearch";
import process from 'node:process'

const { ALGOLIA_APP_ID, ALOGLIA_WRITE_KEY } = process.env

export const handler = documentEventHandler(
  async ({event}: {event: DocumentEvent}) => {

    const {_id, title, hideFromSearch} = event.data

    const algolia = algoliasearch(
      ALGOLIA_APP_ID || '',
      ALOGLIA_WRITE_KEY || ''
    );
    
    try {
      // We are assuming you already have an algolia instance steup with an index called 'posts'
      // addOrUpdateObject documentation: https://www.algolia.com/doc/libraries/javascript/v5/methods/search/add-or-update-object/?client=javascript
      await algolia.addOrUpdateObject({
        indexName: 'posts',
        objectID: _id,
        body: {
          title,
          hideFromSearch // This is an optional field that you can use to hide a document from search results
        }
      })
    } catch (error) {
      console.error('Error syncing to Algolia:', error)
      throw error
    }
    return
  },
)
