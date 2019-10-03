import React from 'react'
import PropTypes from 'prop-types'
import {streamingComponent} from 'react-props-stream'
import {merge, from, of} from 'rxjs'
import {map, switchMap, scan, filter, mergeMap} from 'rxjs/operators'
import {uniq, uniqBy} from 'lodash'
import DefaultPane from 'part:@sanity/components/panes/default'
import {observePaths} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import FormBuilder from 'part:@sanity/form-builder'
import PanePopover from 'part:@sanity/components/dialogs/pane-popover'
import styles from './styles/BrokenReferences.css'
import ReferringDocumentsList from './ReferringDocumentsList'

function BrokenRefs(props) {
  const {documents, type, schema} = props
  const schemaType = schema.get(type)
  const {unpublished, nonExistent} = documents.reduce(
    (groups, doc) => {
      const group = doc.hasDraft ? groups.unpublished : groups.nonExistent
      group.push(doc)
      return groups
    },
    {unpublished: [], nonExistent: []}
  )

  const renderNonExisting = nonExistent.length > 0
  const renderUnpublished = !renderNonExisting
  return (
    <DefaultPane title={`New ${type}`} contentMaxWidth={672} isScrollable={false}>
      <div className={styles.brokenReferences}>
        {renderNonExisting && (
          <PanePopover
            icon
            kind="error"
            id="missing-references"
            title="Missing references"
            subtitle={`The new document can only reference existing documents. ${
              nonExistent.length === 1 ? 'A document' : 'Documents'
            } with the following ID${nonExistent.length === 1 ? ' was' : 's were'} not found:`}
          >
            <ul className={styles.tagList}>
              {nonExistent.map(doc => (
                <li className={styles.tagItem} key={doc.id}>
                  {doc.id}
                </li>
              ))}
            </ul>
          </PanePopover>
        )}
        {renderUnpublished && (
          <PanePopover
            icon
            kind="warning"
            id="unpublished-documents"
            title="Unpublished references"
            subtitle={`A document can only refer to published documents. Publish the following ${
              unpublished.length === 1 ? 'draft' : 'drafts'
            } before creating
            a new document.`}
          >
            <ReferringDocumentsList
              documents={unpublished.map(({id, type, hasDraft}) => ({
                _id: `drafts.${id}`,
                _type: type,
                _hasDraft: hasDraft
              }))}
            />
          </PanePopover>
        )}
      </div>
      <form className={styles.editor}>
        <FormBuilder readOnly type={schemaType} schema={schema} />
      </form>
    </DefaultPane>
  )
}

BrokenRefs.propTypes = {
  schema: PropTypes.any,
  type: PropTypes.any,
  document: PropTypes.any,
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
      const {type, schema} = props
      if (!ids.length) {
        return of(props.children)
      }

      return from(ids).pipe(
        mergeMap(checkExistance),
        scan((prev, curr) => uniqBy([curr, ...prev], 'id'), []),
        filter(docs => docs.length === ids.length),
        map(docs => docs.filter(isMissingPublished)),
        map(broken =>
          broken.length > 0 ? (
            <BrokenRefs documents={broken} type={type} schema={schema} />
          ) : (
            props.children
          )
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
  return uniq(refs.map(ref => (ref || '').replace(/^drafts\./, '')))
}

export default BrokenReferences
