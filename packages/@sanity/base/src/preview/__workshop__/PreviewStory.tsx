import {FolderIcon, WarningOutlineIcon} from '@sanity/icons'
import {SchemaType, SanityDocumentLike} from '@sanity/types'
import {Box, Card, Container, Stack} from '@sanity/ui'
import {assignWith} from 'lodash'
import {combineLatest, Observable, of} from 'rxjs'
import {map, startWith} from 'rxjs/operators'
import React, {useEffect, useMemo, useState} from 'react'
import {useSelect} from '@sanity/ui-workshop'
import {useSchema} from '../../hooks'
import {PreviewLayoutKey} from '../../components/previews'
import {useDocumentPreviewStore} from '../../datastores'
import {getDraftId, getPublishedId} from '../../util/draftUtils'
import {DocumentPreviewStore} from '../documentPreviewStore'
import {SanityDefaultPreview} from '../components/SanityDefaultPreview'
import {WORKSHOP_PREVIEW_LAYOUT} from './constants'

interface PreviewState {
  isLoading?: boolean
  draft?: SanityDocumentLike | null
  published?: SanityDocumentLike | null
}

interface PreviewValue {
  id?: string
  subtitle?: React.ReactNode
  title?: React.ReactNode
  media?: React.ReactNode | React.ComponentType
  icon?: boolean
  type?: string
  displayOptions?: {showIcon?: boolean}
  schemaType?: {name?: string}
}

export default function PreviewStory() {
  const layout = useSelect('Layout', WORKSHOP_PREVIEW_LAYOUT, 'default')

  return (
    <Box padding={4}>
      <Container width={0}>
        <Stack space={2}>
          <Card border style={{lineHeight: 0}}>
            <DocumentPreview id="test" layout={layout} type="author" />
          </Card>
          <Card border style={{lineHeight: 0}}>
            <DocumentPreview
              id="8ab96211-501c-45e3-9eb0-4ed1da1b50df"
              layout={layout}
              type="author"
            />
          </Card>
        </Stack>
      </Container>
    </Box>
  )
}

function DocumentPreview(props: {id: string; layout?: PreviewLayoutKey; type: string}) {
  const {id, layout, type} = props
  const previewState = useDocumentPreviewState({id, type})
  const schema = useSchema()
  const schemaType = schema.get(type)
  const icon = getIconWithFallback(undefined, schemaType, FolderIcon)

  const value = previewState
    ? getValueWithFallback({
        value: previewState.draft || previewState.published || {_id: 'test', _type: 'test'},
        draft: previewState.draft,
        published: previewState.published,
      })
    : null

  if (!value) {
    return <div>No preview value</div>
  }

  return <SanityDefaultPreview icon={icon} layout={layout} value={value} />
}

/**
 * Return `false` if we explicitly disable the icon.
 * Otherwise return the passed icon or the schema type icon as a backup.
 */
function getIconWithFallback(
  icon: React.ComponentType | false | undefined,
  schemaType: SchemaType | undefined,
  defaultIcon: React.ComponentType
): React.ComponentType | false {
  if (icon === false) {
    return false
  }

  return icon || (schemaType && schemaType.icon) || defaultIcon || false
}

function getMissingDocumentFallback(item: SanityDocumentLike): PreviewValue {
  return {
    title: (
      <span style={{fontStyle: 'italic'}}>
        {item.title ? String(item.title) : 'Missing document'}
      </span>
    ),
    subtitle: (
      <span style={{fontStyle: 'italic'}}>
        {item.title ? `Missing document ID: ${item._id}` : `Document ID: ${item._id}`}
      </span>
    ),
    media: WarningOutlineIcon,
  }
}

function getValueWithFallback({
  value,
  draft,
  published,
}: {
  value: SanityDocumentLike
  draft?: SanityDocumentLike | null
  published?: SanityDocumentLike | null
}): PreviewValue | SanityDocumentLike {
  const snapshot = draft || published

  if (!snapshot) {
    return getMissingDocumentFallback(value)
  }

  return assignWith({}, snapshot, value, (objValue, srcValue) => {
    return typeof srcValue === 'undefined' ? objValue : srcValue
  })
}

function useDocumentPreviewState(props: {id: string; type: string; title?: unknown}) {
  const schema = useSchema()
  const documentPreviewStore = useDocumentPreviewStore()
  const schemaType = schema.get(props.type)
  const previewState$ = useMemo(
    () =>
      schemaType
        ? getPreviewStateStream(documentPreviewStore, schemaType, props.id, props.title)
        : null,
    [documentPreviewStore, props.id, props.title, schemaType]
  )
  const [state, setState] = useState<PreviewState | null>(null)

  useEffect(() => {
    if (!previewState$) {
      return undefined
    }

    const sub = previewState$.subscribe(setState)

    return () => sub.unsubscribe()
  }, [previewState$])

  return state
}

function isLiveEditEnabled(schemaType: SchemaType) {
  return schemaType.liveEdit === true
}

function getPreviewStateStream(
  documentPreviewStore: DocumentPreviewStore,
  schemaType: SchemaType,
  documentId: string,
  title: unknown
): Observable<PreviewState> {
  const draft$ = isLiveEditEnabled(schemaType)
    ? of({snapshot: null})
    : documentPreviewStore.observeForPreview(
        {_type: 'reference', _ref: getDraftId(documentId)},
        schemaType
      )

  const published$ = documentPreviewStore.observeForPreview(
    {_type: 'reference', _ref: getPublishedId(documentId)},
    schemaType
  )

  return combineLatest([draft$, published$]).pipe(
    map(([draft, published]) => ({
      draft: draft.snapshot ? {title, ...(draft.snapshot || {})} : null,
      isLoading: false,
      published: published.snapshot ? {title, ...(published.snapshot || {})} : null,
    })),
    startWith({draft: null, isLoading: true, published: null})
    // tap(console.log)
  )
}
