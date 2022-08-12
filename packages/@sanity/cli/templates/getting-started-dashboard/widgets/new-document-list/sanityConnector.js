import {of as observableOf} from 'rxjs'
import {switchMap, delay, tap, mergeMap} from 'rxjs/operators'
import {uniqBy, intersection} from 'lodash'
import sanityClient from 'part:@sanity/base/client'
import schema from 'part:@sanity/base/schema'

const schemaTypeNames = schema.getTypeNames()
const withConfig = (config) => {
  return typeof sanityClient.withConfig === 'function'
    ? sanityClient.withConfig(config)
    : sanityClient
}
const draftId = (nonDraftDoc) => `drafts.${nonDraftDoc._id}`

/**
 * This function takes a list of documents, and returns drafts for any
 * documents that has drafts
 */
const prepareDocumentList = (incoming, apiVersion) => {
  if (!incoming) {
    return Promise.resolve([])
  }
  const documents = Array.isArray(incoming) ? incoming : [incoming]
  const ids = documents.filter((doc) => !doc._id.startsWith('drafts.')).map(draftId)

  return withConfig({apiVersion})
    .fetch('*[_id in $ids]', {ids})
    .then((drafts) => {
      const outgoing = documents.map((doc) => {
        const foundDraft = drafts.find((draft) => draft._id === draftId(doc))
        return foundDraft || doc
      })
      return uniqBy(outgoing, '_id')
    })
    .catch((error) => {
      throw new Error(`Problems fetching docs ${ids}. Error: ${error.message}`)
    })
}

/**
 * This function uses the Sanity client in the studio to listen for document updates
 */
export const getSubscription = (query, params, apiVersion) =>
  withConfig({apiVersion})
    .listen(query, params, {
      events: ['welcome', 'mutation'],
      includeResult: false,
      visibility: 'query',
      tag: 'dashboard-widget.get-document-list',
    })
    .pipe(
      switchMap((event) => {
        return observableOf(1).pipe(
          event.type === 'welcome' ? tap() : delay(1000),
          mergeMap(() =>
            withConfig({apiVersion})
              .fetch(query, params)
              .then((incoming) => {
                return prepareDocumentList(incoming, apiVersion)
              })
              .catch((error) => {
                if (error.message.startsWith('Problems fetching docs')) {
                  throw error
                }
                throw new Error(
                  `Query failed ${query} and ${JSON.stringify(params)}. Error: ${error.message}`
                )
              })
          )
        )
      })
    )

/**
 * This function puts together a GROQ query based on the document types in
 * your schema, that is used by the code above to get recent documents
 */
export function assembleQuery(options) {
  const {query = null, queryParams = {}, types = null, order, limit} = options

  if (query) {
    return {assembledQuery: query, params: queryParams}
  }

  const documentTypes = schemaTypeNames.filter((typeName) => {
    const schemaType = schema.get(typeName)
    return schemaType.type && schemaType.type.name === 'document'
  })

  return {
    assembledQuery: `*[_type in $types] | order(${order}) [0...${limit * 2}]`,
    params: {types: types ? intersection(types, documentTypes) : documentTypes},
  }
}
