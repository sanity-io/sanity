import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {type SanityDocumentLike} from '@sanity/types'
import {Box, Grid, Stack, Text, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useObservableEvent} from 'react-rx'
import {catchError, concat, filter, map, type Observable, of, scan, switchMap, tap} from 'rxjs'
import {
  createSearch,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  getPublishedId,
  isDraftId,
  isNonNullable,
  isPublishedId,
  isVersionId,
  ReferenceAutocomplete,
  type SanityClient,
  type SchemaType,
  type SearchStrategy,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useSource,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {CreateNewIncomingReference} from './CreateNewIncomingReference'
import {LinkToExistingPreview} from './LinkToExistingPreview'
import {type IncomingReferencesOptions} from './types'

interface ReferenceSearchState {
  hits: ReferenceSearchHit[]
  isLoading: boolean
  searchString?: string
}

interface ReferenceOption {
  value: string
  hit: ReferenceSearchHit
}
interface ReferenceSearchHit {
  _id: string
  _type: string
}

const INITIAL_SEARCH_STATE: ReferenceSearchState = {
  hits: [],
  isLoading: false,
}
const NO_FILTER = () => true

const incomingReferenceSearch = (
  client: SanityClient,
  schemaType: SchemaType,
  searchStrategy: SearchStrategy | undefined,
): ((textTerm: string) => Observable<ReferenceSearchHit[]>) => {
  const search = createSearch([schemaType], client, {
    maxDepth: DEFAULT_MAX_FIELD_DEPTH,
    strategy: searchStrategy,
    tag: 'search.incoming-reference',
  })
  return (textTerm: string) =>
    search(textTerm, {perspective: 'raw'}).pipe(
      map(({hits}) => hits.map(({hit}) => hit)),
      map((docs) => {
        // We want to collate drafts and published documents into a single entry, but keep the versions as a separate entry
        const byId: Map<string, SanityDocumentLike> = new Map()

        docs.forEach((doc) => {
          if (isVersionId(doc._id)) {
            // We want to preserve version documents as a different entry.
            byId.set(doc._id, doc)
            return
          }
          const publishedId = getPublishedId(doc._id)
          const entry = byId.get(publishedId)
          if (!entry) {
            byId.set(publishedId, doc)
            // If the document is a draft and the entry is published, we want to keep the draft.
          } else if (isDraftId(doc._id) && isPublishedId(entry._id)) {
            byId.set(publishedId, doc)
          }
        })
        return Array.from(byId.values())
      }),
      map((collated) =>
        collated.map((entry) => ({
          _id: entry._id,
          _type: entry._type,
        })),
      ),
      map((docs) => docs.slice(0, 100)),
    )
}

/**
 * This component is responsible for two things:
 * 1) Search for the document type to add to the incoming references.
 * 2) Render the CreateNewIncomingReference button. Allowing users to add a new incoming reference.
 */
export function AddIncomingReference({
  type,
  referenced,
  onCreateNewReference,
  onLinkDocument,
  fieldName,
  creationAllowed,
}: {
  type: string
  referenced: {id: string; type: string}
  onCreateNewReference: (id: string) => void
  onLinkDocument: (documentId: string) => void
  fieldName: string
  creationAllowed: IncomingReferencesOptions['creationAllowed']
}) {
  const {t} = useTranslation(structureLocaleNamespace)
  const {push} = useToast()
  const schema = useSchema()
  const schemaType = schema.get(type)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const source = useSource()
  const {strategy: searchStrategy} = source.search
  const documentPreviewStore = useDocumentPreviewStore()
  const handleSearch = useMemo(
    () => incomingReferenceSearch(client, schemaType!, searchStrategy),
    [client, schemaType, searchStrategy],
  )

  const [searchState, setSearchState] = useState(INITIAL_SEARCH_STATE)
  const handleQueryChange = useObservableEvent((inputValue$: Observable<string | null>) => {
    return inputValue$.pipe(
      filter(isNonNullable),
      switchMap((searchString) =>
        concat(
          of({isLoading: true, hits: []}),
          handleSearch(searchString).pipe(
            map((hits) => ({hits, searchString, isLoading: false})),
            catchError((error) => {
              push({
                title: 'Reference search failed',
                description: error.message,
                status: 'error',
                id: `reference-search-fail-${type}`,
              })
              console.error(error)
              return of({hits: [], isLoading: false})
            }),
          ),
        ),
      ),

      scan(
        (prevState, nextState: ReferenceSearchState) => ({...prevState, ...nextState}),
        INITIAL_SEARCH_STATE,
      ),

      tap(setSearchState),
    )
  })

  const options: ReferenceOption[] = useMemo(() => {
    return searchState.hits.map((hit) => ({
      value: hit._id,
      hit: hit,
    }))
  }, [searchState.hits])

  const handleAutocompleteOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const renderOption = useCallback(
    (option: ReferenceOption) => {
      return (
        <LinkToExistingPreview
          onLinkToDocument={() => onLinkDocument(option.value)}
          documentPreviewStore={documentPreviewStore}
          schemaType={schemaType!}
          value={option.hit}
        />
      )
    },
    [documentPreviewStore, schemaType, onLinkDocument],
  )

  return (
    <Stack space={2} padding={2}>
      <Box paddingY={2}>
        <Text size={1} weight="medium">
          {t('incoming-references-input.reference-from', {type})}
        </Text>
      </Box>
      <Grid gap={creationAllowed ? 2 : 0} style={{gridTemplateColumns: '1fr min-content'}}>
        <ReferenceAutocomplete
          id={`${type}-autocomplete`}
          radius={2}
          autoFocus
          options={options}
          placeholder={t('incoming-references-input.type-to-search')}
          onQueryChange={handleQueryChange}
          filterOption={NO_FILTER}
          path={[]}
          // @ts-expect-error - Types are not derived correctly
          renderOption={renderOption}
          openButton={{onClick: handleAutocompleteOpenButtonClick}}
          referenceElement={null}
          loading={searchState.isLoading}
        />
        <CreateNewIncomingReference
          type={type}
          referenceToId={referenced.id}
          referenceToType={referenced.type}
          creationAllowed={creationAllowed}
          onCreateNewReference={onCreateNewReference}
          fieldName={fieldName}
        />
      </Grid>
    </Stack>
  )
}
