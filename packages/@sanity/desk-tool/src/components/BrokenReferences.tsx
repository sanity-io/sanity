import {Box, Card, Inline, Text} from '@sanity/ui'
import React from 'react'
import {streamingComponent} from 'react-props-stream'
import {merge, from, of, Observable} from 'rxjs'
import {map, switchMap, scan, filter, mergeMap} from 'rxjs/operators'
import {uniq, uniqBy} from 'lodash'
import DefaultPane from 'part:@sanity/components/panes/default'
import {observePaths} from 'part:@sanity/base/preview'
import {getDraftId, getPublishedId} from 'part:@sanity/base/util/draft-utils'
import FormBuilder from 'part:@sanity/form-builder'
import PanePopover from 'part:@sanity/components/dialogs/pane-popover'
import {ReferringDocumentsList} from './ReferringDocumentsList'

interface DocRef {
  id: string
  type: string
  hasDraft: boolean
}

export interface BrokenRefsProps {
  schema?: any
  type?: any
  documents: DocRef[]
}

function BrokenRefs(props: BrokenRefsProps) {
  const {documents, type, schema} = props
  const schemaType = schema.get(type)

  const {unpublished, nonExistent} = documents.reduce(
    (groups: {unpublished: DocRef[]; nonExistent: DocRef[]}, doc: DocRef) => {
      const group = doc.hasDraft ? groups.unpublished : groups.nonExistent
      group.push(doc)
      return groups
    },
    {unpublished: [], nonExistent: []}
  )

  const renderNonExisting = nonExistent.length > 0
  const renderUnpublished = !renderNonExisting

  return (
    <DefaultPane title={`New ${type}`} isScrollable={false}>
      <Box>
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
            <Inline space={1}>
              {nonExistent.map((doc) => (
                <Card key={doc.id} padding={2} radius={2} tone="critical">
                  <Text>{doc.id}</Text>
                </Card>
              ))}
            </Inline>
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
              documents={unpublished.map(({id, type: _type, hasDraft}) => ({
                _id: `drafts.${id}`,
                _type: _type,
                _hasDraft: hasDraft,
              }))}
            />
          </PanePopover>
        )}
      </Box>

      <Box as="form" paddingX={4}>
        <FormBuilder readOnly type={schemaType} schema={schema} />
      </Box>
    </DefaultPane>
  )
}

// @todo consider adding a progress indicator instead?
export const BrokenReferences = streamingComponent(
  (props$: Observable<{children?: React.ReactNode; document: any; schema: any; type: any}>) =>
    props$.pipe(
      switchMap((props) => {
        const ids = findReferences(props.document)
        const {type, schema} = props
        if (!ids.length) {
          return of(props.children)
        }

        return from(ids).pipe(
          mergeMap(checkExistence) as any,
          scan((prev, curr) => uniqBy([curr, ...prev], 'id') as any, []),
          filter((docs) => docs.length === ids.length),
          map((docs) => docs.filter(isMissingPublished)),
          map((broken) =>
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

function checkExistence(id: string) {
  return merge(
    observePaths(getDraftId(id), ['_type']).pipe(map((draft) => ({draft}))),
    observePaths(getPublishedId(id), ['_type']).pipe(map((published) => ({published})))
  ).pipe(
    scan((prev: Record<string, any>, res: Record<string, any>) => ({...prev, ...res}), {}),
    filter((res) => 'draft' in res && 'published' in res),
    map((res) => ({
      id,
      type: getDocumentType(res as any),
      hasDraft: Boolean(res.draft),
      hasPublished: Boolean(res.published),
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
          ? ([...refs, value[key]] as any)
          : [...refs, ...extractStrongReferences(value[key])],
      []
    )
  }

  return []
}

function dedupeReferences(refs) {
  return uniq(refs.map((ref) => (ref || '').replace(/^drafts\./, '')))
}
