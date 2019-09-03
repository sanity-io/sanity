import React from 'react'
import PropTypes from 'prop-types'
import {streamingComponent} from 'react-props-stream'
import {merge, from, of} from 'rxjs'
import {map, switchMap, scan, filter, mergeMap} from 'rxjs/operators'
import {uniq, uniqBy} from 'lodash'
import DefaultPane from 'part:@sanity/components/panes/default'
import {observePaths} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import ReferringDocumentsList from './ReferringDocumentsList'

// @todo get some designers to pretty this up (and reword it)
function BrokenRefs(props) {
  const {documents} = props

  const {unpublished, nonExistent} = documents.reduce(
    (groups, doc) => {
      const group = doc.hasDraft ? groups.unpublished : groups.nonExistent
      group.push(doc)
      return groups
    },
    {unpublished: [], nonExistent: []}
  )

  const isMultiDoc = documents.length > 1
  const documentsText = isMultiDoc ? 'other documents' : 'another document'
  const actionDocText = isMultiDoc ? 'these other documents' : 'the other document'
  let missingText = 'do not exist'
  let actionText = 'must be created'
  if (unpublished.length > 0 && nonExistent.length > 0) {
    missingText = 'do not exist and/or are not published'
    actionText = 'must first be created and published'
  } else if (unpublished.length > 0) {
    missingText = `${isMultiDoc ? 'are' : 'is'} not published`
    actionText = 'must first be published'
  }

  return (
    <DefaultPane title="Broken references">
      <p>
        The initial value for this document references {documentsText} that {missingText}. In order
        to create <em>this</em> document, {actionDocText} {actionText}.
      </p>

      {unpublished.length > 0 && (
        <>
          <h2>Unpublished documents:</h2>
          <ReferringDocumentsList
            documents={unpublished.map(({id, type}) => ({_id: `drafts.${id}`, _type: type}))}
          />
        </>
      )}

      {nonExistent.length > 0 && (
        <>
          <h2>Non-existent document IDs:</h2>
          <ul>
            {nonExistent.map(doc => (
              <li key={doc.id}>{doc.id}</li>
            ))}
          </ul>
        </>
      )}
    </DefaultPane>
  )
}

BrokenRefs.propTypes = {
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      hasDraft: PropTypes.bool.isRequired
    })
  )
}

// @todo consider adding a progress indicator instead?
const BrokenReferences = streamingComponent(props$ =>
  props$.pipe(
    switchMap(props => {
      const ids = findReferences(props.document)

      if (!ids.length) {
        return of(props.children)
      }

      return from(ids).pipe(
        mergeMap(checkExistance),
        scan((prev, curr) => uniqBy([curr, ...prev], 'id'), []),
        filter(docs => docs.length === ids.length),
        map(docs => docs.filter(isMissingPublished)),
        map(broken =>
          broken.length > 0 ? <BrokenRefs documents={broken}>eek</BrokenRefs> : props.children
        )
      )
    })
  )
)

function checkExistance(id) {
  return merge(
    observePaths(getDraftId(id), ['_type']).pipe(map(draft => ({draft}))),
    observePaths(getPublishedId(id), ['_type']).pipe(map(published => ({published})))
  ).pipe(
    scan((prev, res) => ({...prev, ...res}), {}),
    filter(res => 'draft' in res && 'published' in res),
    map(res => ({
      id,
      type: getDocumentType(res),
      hasDraft: Boolean(res.draft),
      hasPublished: Boolean(res.published)
    }))
  )
}

function getDocumentType({draft, published}) {
  if (draft || published) {
    return draft ? draft._type : published._type
  }

  return undefined
}

function isMissingPublished(doc) {
  return !doc.hasPublished
}

function findReferences(value) {
  return dedupeReferences(extractStrongReferences(value))
}

function extractStrongReferences(value) {
  if (Array.isArray(value)) {
    return value.reduce((refs, item) => [...refs, ...extractStrongReferences(item)], [])
  }

  if (typeof value === 'object' && value !== null) {
    return Object.keys(value).reduce(
      (refs, key) =>
        key === '_ref' && !value._weak
          ? [...refs, value[key]]
          : [...refs, ...extractStrongReferences(value[key])],
      []
    )
  }

  return []
}

function dedupeReferences(refs) {
  return uniq(refs.map(ref => ref.replace(/^drafts\./, '')))
}

export default BrokenReferences
