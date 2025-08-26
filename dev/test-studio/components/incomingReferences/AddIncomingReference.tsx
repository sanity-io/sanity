import {DEFAULT_MAX_FIELD_DEPTH} from '@sanity/schema/_internal'
import {Autocomplete, Box, Flex, Grid, Popover, Stack, Text, useToast} from '@sanity/ui'
import {type Ref, useCallback, useMemo, useRef, useState} from 'react'
import {useObservableEvent} from 'react-rx'
import {catchError, concat, filter, map, type Observable, of, scan, switchMap, tap} from 'rxjs'
import {
  createSearch,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  isNonNullable,
  type SanityClient,
  type SchemaType,
  type SearchStrategy,
  useClient,
  useDocumentPreviewStore,
  useSchema,
  useSource,
} from 'sanity'
import {styled} from 'styled-components'

import {CreateNewIncomingReference} from './CreateNewIncomingReference'
import {LinkToExistingPreview} from './LinkToExistingPreview'

const StyledPopover = styled(Popover)`
  & > div {
    overflow: auto;
    -webkit-overflow-scrolling: touch;
  }
`

interface ReferenceSearchState {
  hits: ReferenceSearchHit[]
  isLoading: boolean
  searchString?: string
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
      tap((res) => console.log('results for', textTerm, res)),
      map(({hits}) => hits.map(({hit}) => hit)),
      map((docs) => docs.slice(0, 100)),
      map((collated) =>
        collated.map((entry) => ({
          _id: entry._id,
          _type: entry._type,
        })),
      ),
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
}: {
  type: string
  referenced: {id: string; type: string}
  onCreateNewReference: (id: string) => void
  onLinkDocument: (documentId: string) => void
}) {
  const {push} = useToast()
  const schema = useSchema()
  const schemaType = schema.get(type)
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const source = useSource()
  const {strategy: searchStrategy} = source.search
  const autoCompletePortalRef = useRef<HTMLDivElement>(null)
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

  const options = useMemo(() => {
    return searchState.hits.map((hit) => ({
      value: hit._id,
      hit: hit,
    }))
  }, [searchState.hits])
  const handleAutocompleteOpenButtonClick = useCallback(() => {
    handleQueryChange('')
  }, [handleQueryChange])

  const renderOption = useCallback(
    (option: {value: string; hit: ReferenceSearchHit}) => {
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

  const renderPopover = useCallback(
    (
      props: {
        content: React.JSX.Element | null
        hidden: boolean
        inputElement: HTMLInputElement | null
        onMouseEnter: () => void
        onMouseLeave: () => void
      },
      contentRef: Ref<HTMLDivElement>,
    ) => (
      <StyledPopover
        data-testid="autocomplete-popover"
        placement="bottom-start"
        arrow={false}
        constrainSize
        onMouseEnter={props.onMouseEnter}
        fallbackPlacements={['bottom', 'top']}
        onMouseLeave={props.onMouseLeave}
        content={
          <div ref={contentRef}>
            {options?.length ? (
              props.content
            ) : (
              <Box padding={4}>
                <Flex align="center" height="fill" justify="center">
                  <Text align="center" muted>
                    No results for {searchState.searchString}
                  </Text>
                </Flex>
              </Box>
            )}
          </div>
        }
        open={!searchState.isLoading && !props.hidden}
        ref={autoCompletePortalRef}
        portal
        referenceElement={props.inputElement}
        matchReferenceWidth
      />
    ),
    [options, searchState.searchString, searchState.isLoading, autoCompletePortalRef],
  )

  return (
    <Stack space={2} padding={2}>
      <Box paddingY={2}>
        <Text size={1} weight="medium">
          Reference from {type}
        </Text>
      </Box>
      <Grid gap={2} style={{gridTemplateColumns: '1fr min-content'}}>
        <Autocomplete
          id={`${type}-autocomplete`}
          radius={2}
          autoFocus
          options={options}
          placeholder="Type to search"
          onQueryChange={handleQueryChange}
          filterOption={NO_FILTER}
          renderOption={renderOption}
          openButton={{onClick: handleAutocompleteOpenButtonClick}}
          renderPopover={renderPopover}
        />
        <CreateNewIncomingReference
          type={type}
          referenceToId={referenced.id}
          referenceToType={referenced.type}
          // TODO: Add option to disable new references.
          disableNew={false}
          onCreateNewReference={onCreateNewReference}
        />
      </Grid>
    </Stack>
  )
}
