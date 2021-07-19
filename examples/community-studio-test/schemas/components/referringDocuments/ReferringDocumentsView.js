import React from 'react'
import QueryContainer from 'part:@sanity/base/query-container'
import Spinner from 'part:@sanity/components/loading/spinner'
import Snackbar from 'part:@sanity/components/snackbar/default'

import ReferringDocumentsList from './ReferringDocumentsList'

const typelessQuery = `
 *[references($id) && !(_id in path("drafts.*"))]
`

const typefulQuery = `
 *[references($id) && !(_id in path("drafts.*"))  && _type in $types]
`

const ReferringDocumentsView = ({
  document,
  types = [],
}) => {
  if (!document?.displayed?._id) {
    return null
  }
  return (
    <QueryContainer
      query={types.length ? typefulQuery : typelessQuery}
      params={{
        id: document.displayed._id,
        types,
      }}
    >
      {({ result, loading, error, onRetry }) => {
        if (error) {
          return (
            <Snackbar
              kind="error"
              isPersisted
              actionTitle="Retry"
              onAction={onRetry}
              title="An error occurred while loading items:"
              subtitle={<div>{error.message}</div>}
            />
          )
        }

        if (loading) {
          return (
            <div>{loading && <Spinner center message="Loading items…" />}</div>
          )
        }

        if (!result) {
          return null
        }

        return (
          <div>
            {result && <ReferringDocumentsList documents={result.documents} />}
          </div>
        )
      }}
    </QueryContainer>
  )
}

export default ReferringDocumentsView

/**
 *  Get a React component that displays document referencing to the current document in a document's view
  * @param {string[]} types which types can refer to this document
 */
export const getReferringDocumentsFromType = (types) => {
  return (props) => (
    <ReferringDocumentsView {...props} types={types} />
  )
}
