import {type SanityClient} from '@sanity/client'
import {DocumentIcon} from '@sanity/icons/Document'
import {Card} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  getVersionFromId,
  isDraftId,
  type PerspectiveStack,
  type PreviewProps,
  type Schema,
  SanityDefaultPreview,
  type SchemaType,
  useClient,
  useSchema,
} from 'sanity'
import {
  createSearch,
  DEFAULT_STUDIO_CLIENT_OPTIONS,
  useValuePreview,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

import {cx} from '../../util/cx'
import {getDocumentTypeNames} from '../../util/documentTypes'
import * as styles from '../redesign.module.css'
import * as themeStyles from '../themeTokens.module.css'

/** Wait for a pause in typing before the dataset is queried */
const SEARCH_DEBOUNCE_MS = 300
/** Enough rows to pick from, not the reference picker's full page */
const SEARCH_LIMIT = 20

const SearchClientContext = createContext<SanityClient | null>(null)

/**
 * The client the document-id search reads with: the tab's dataset and perspective. Without one,
 * the search uses the workspace client.
 */
export function DocumentIdSearchClient({
  client,
  children,
}: {
  client: SanityClient | null
  children: ReactNode
}) {
  return <SearchClientContext value={client}>{children}</SearchClientContext>
}

interface DocumentIdOption {
  value: string
  typeName: string
}

interface DocumentHit {
  id: string
  type: string
}

interface DocumentIdInputProps {
  id?: string
  label?: string
  /**
   * Document types the query limits this id to. Absent, or empty: every document type in the
   * schema.
   */
  documentTypes: string[] | undefined
  value: unknown
  /** What an emptied input sends: nothing for a param, an empty string for a list item */
  empty: unknown
  disabled: boolean
  invalid?: string
  placeholder: string
  onChange: (value: unknown) => void
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isPreviewMedia(media: unknown): media is NonNullable<PreviewProps['media']> {
  return typeof media === 'object' && media !== null && !Array.isArray(media)
}

function previewMedia(media: unknown): Pick<PreviewProps, 'imageUrl' | 'media'> {
  if (typeof media === 'string' && /^https?:\/\//.test(media)) return {imageUrl: media}
  if (isPreviewMedia(media)) return {media}
  return {}
}

const PUBLISHED_PERSPECTIVE: PerspectiveStack = []
const DRAFTS_PERSPECTIVE: PerspectiveStack = ['drafts']

/** The perspective that sees the document an id names. A preview without one only sees published. */
function previewPerspective(id: string): PerspectiveStack {
  if (isDraftId(id)) return DRAFTS_PERSPECTIVE
  const release = getVersionFromId(id)
  return release ? [release] : PUBLISHED_PERSPECTIVE
}

function searchTypes(schema: Schema, documentTypes: string[] | undefined): SchemaType[] {
  const names =
    documentTypes && documentTypes.length > 0 ? documentTypes : getDocumentTypeNames(schema)
  return names.flatMap((name) => {
    const type = schema.get(name)
    return type ? [type] : []
  })
}

function toHits(result: {hits: {hit: {_id: string; _type: string}}[]}): DocumentHit[] {
  const seen = new Set<string>()
  const hits: DocumentHit[] = []
  for (const {hit} of result.hits) {
    if (!hit?._id || !hit._type || seen.has(hit._id)) continue
    seen.add(hit._id)
    hits.push({id: hit._id, type: hit._type})
  }
  return hits
}

function DocumentIdOptionRow({id, typeName}: {id: string; typeName: string}) {
  const schema = useSchema()
  const schemaType = schema.get(typeName)
  const value = useMemo(() => ({_id: id, _type: typeName}), [id, typeName])
  const perspectiveStack = useMemo(() => previewPerspective(id), [id])
  const {value: preview} = useValuePreview({perspectiveStack, schemaType, value})
  const title = typeof preview?.title === 'string' && preview.title ? preview.title : id
  return (
    <Card data-as="button" padding={2} radius={2} tone="inherit">
      <SanityDefaultPreview
        icon={schemaType?.icon ?? DocumentIcon}
        layout="compact"
        subtitle={title === id ? schemaType?.title : id}
        title={title}
        {...previewMedia(preview?.media)}
      />
    </Card>
  )
}

function renderDocumentIdOption(option: DocumentIdOption) {
  return <DocumentIdOptionRow id={option.value} typeName={option.typeName} />
}

/**
 * Documents of the selected dataset to pick an id from, the way Structure's reference picker
 * searches. The search only reads. Typing any other text is still sent, for testing.
 */
export function DocumentIdInput(props: DocumentIdInputProps) {
  const {id, label, documentTypes, value, empty, disabled, invalid, placeholder, onChange} = props
  const fallbackId = useId()
  const schema = useSchema()
  const providedClient = use(SearchClientContext)
  const workspaceClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const client = providedClient ?? workspaceClient
  const text = toText(value)
  const types = useMemo(() => searchTypes(schema, documentTypes), [documentTypes, schema])
  const [hits, setHits] = useState<DocumentHit[]>([])
  const [searchText, setSearchText] = useState<string | null>(null)
  const [settledQuery, setSettledQuery] = useState<string | null>(null)
  // Same as the document-type autocomplete: opening reports the current text as the query, and
  // Autocomplete clears that query when `value` changes. Hold it so typing does not reset the field.
  const openQuery = useRef<string | null>(null)
  const [heldValue, setHeldValue] = useState<string | null>(null)
  // What this field last wrote. When the value differs, something outside cleared or replaced it.
  const [written, setWritten] = useState(text)
  if (text !== written) {
    setWritten(text)
    setHeldValue(null)
    setSearchText(null)
  }
  const activeQuery = searchText?.trim() || null
  const [hitsFor, setHitsFor] = useState<string | null>(activeQuery)
  if (activeQuery !== hitsFor) {
    setHitsFor(activeQuery)
    setHits([])
    setSettledQuery(null)
  }
  const loading = activeQuery !== null && types.length > 0 && settledQuery !== activeQuery

  useEffect(() => {
    if (!activeQuery || types.length === 0) return undefined
    let active = true
    let subscription: {unsubscribe: () => void} | undefined
    const timer = setTimeout(() => {
      if (!active) return
      // Read only: `createSearch` fetches a GROQ query. It never mutates.
      const search = createSearch(types, client, {tag: 'vision.document-id'})
      const {perspective, variant} = client.config()
      subscription = search(activeQuery, {
        limit: SEARCH_LIMIT,
        perspective,
        ...(typeof variant === 'string' && variant !== '' ? {variant} : {}),
      }).subscribe({
        next: (result) => {
          if (!active) return
          setHits(toHits(result))
          setSettledQuery(activeQuery)
        },
        error: () => {
          if (!active) return
          setHits([])
          setSettledQuery(activeQuery)
        },
      })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      active = false
      clearTimeout(timer)
      subscription?.unsubscribe()
    }
  }, [activeQuery, client, types])

  const options = useMemo(
    (): DocumentIdOption[] => hits.map((hit) => ({value: hit.id, typeName: hit.type})),
    [hits],
  )

  const change = (next: string) => {
    const stored = next === '' ? '' : next
    if (stored === text) return
    setWritten(stored)
    onChange(next === '' ? empty : next)
  }

  return (
    <Autocomplete
      aria-label={label}
      customValidity={invalid}
      disabled={disabled}
      // The dataset search already matched title, preview and id. Filtering again would hide a
      // title match whose id does not contain the query.
      filterOption={() => true}
      fontSize={1}
      id={id ?? fallbackId}
      loading={loading}
      onChange={change}
      onQueryChange={(query) => {
        if (query === null) {
          openQuery.current = null
          setHeldValue(null)
          setSearchText(null)
          return
        }
        if (openQuery.current === null) openQuery.current = query
        setHeldValue((current) => current ?? openQuery.current ?? text)
        setSearchText(query)
        change(query)
      }}
      openButton
      options={options}
      placeholder={placeholder}
      popover={{
        className: cx(styles.popoverScroll, styles.documentIdMenu, themeStyles.themeTokens),
        constrainSize: true,
        matchReferenceWidth: false,
        portal: true,
      }}
      renderOption={renderDocumentIdOption}
      value={heldValue ?? text}
    />
  )
}
