import React from 'react'
import PropTypes from 'prop-types'
import {List, Item} from 'part:@sanity/components/lists/default'
import QueryContainer from 'part:@sanity/base/query-container'
import ReferringDocumentListItem from './ReferringDocumentListItem'

const ReferringDocumentsList = props => (
  <QueryContainer
    query="*[!(_id in path('drafts.*')) && references($docId)] [0...101] {_id, _type}"
    params={{docId: props.documentId}}>
    {({result, loading, error, onRetry}) => {
      if (error) {
        return <div>Error: {error}</div>
      }

      if (loading) {
        return null
      }

      const docs = result.documents
      if (docs.length === 0) {
        return null
      }

      return (
        <div>
          <h2>Referring documents:</h2>

          <List>
            {docs.map(doc =>
              <ReferringDocumentListItem key={doc._id} document={doc} />
            )}

            {docs.length > 100 && (
              <Item>+ More documents</Item>
            )}
          </List>
        </div>
      )
    }}
  </QueryContainer>
)

ReferringDocumentsList.propTypes = {
  documentId: PropTypes.string.isRequired
}

export default ReferringDocumentsList
