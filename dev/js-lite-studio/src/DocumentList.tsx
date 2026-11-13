/**
 * The document list pane: every document of a type in a virtualized list. Once the replica has
 * warmed the type, the list is sorted and searched in memory; until then it fetches the ids of the
 * pages that scroll into view, kept current by a listener. Either way, a row shows its document
 * only once the replica (or the open document) holds all of its group.
 */
import {ComposeIcon} from '@sanity/icons/Compose'
import {DocumentIcon} from '@sanity/icons/Document'
import {SearchIcon} from '@sanity/icons/Search'
import {SortIcon} from '@sanity/icons/Sort'
import {SyncIcon} from '@sanity/icons/Sync'
import {Box, Button, Card, Flex, Skeleton, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {perf} from './app-state'
import {client, errorMessage} from './client'
import {
  parsePerspective,
  type Perspective,
  perspectiveParam,
  queryPerspective,
  releaseName,
} from './perspective'
import {type DocPreview} from './preview-data'
import {imageUrl, localPreview} from './previews'
import * as replica from './replica'
import {linkClick, navigate, perspective as perspectiveAtom, route, routeHref} from './router'
import {schema} from './schema'
import {Atom, useAtom} from './state'
import * as store from './store'
import {toastError} from './toasts'
import {useDismiss} from './ui'
import {draftId, publishedId, releaseOf, sleep, storageGet, storageSet, timeAgo} from './util'
import {VirtualList} from './VirtualList'

const PAGE = 100
export const ROW_HEIGHT = 49
/** Pages refetched when the list changes; further pages are dropped and load again on scroll. */
const LIVE_PAGES = 5
/** How often a failed page query is retried, a second apart and then doubling. */
const PAGE_RETRIES = 3

export type Ordering = 'updated' | 'created' | 'title'
const ORDERINGS: Ordering[] = ['updated', 'created', 'title']
const ORDERING_TITLES: Record<Ordering, string> = {
  updated: 'Last edited',
  created: 'Created',
  title: 'Title',
}

function orderingGroq(ordering: Ordering, titleField: string | undefined): string {
  switch (ordering) {
    case 'updated':
      return '_updatedAt desc'
    case 'created':
      return '_createdAt desc'
    case 'title':
      return titleField ? `lower(${titleField}) asc, _id asc` : '_id asc'
    default: {
      const exhaustive: never = ordering
      return exhaustive
    }
  }
}

interface ListSnapshot {
  /** The published ids of the rows, `undefined` for rows whose page has not loaded. */
  rows: (string | undefined)[]
  total: number | undefined
  error: string | undefined
  scrollReset: number
}

/** The list's rows and paging, outside React so page loads don't depend on render timing. */
class ListController {
  readonly state = new Atom<ListSnapshot>({
    rows: [],
    total: undefined,
    error: undefined,
    scrollReset: 0,
  })
  ordering: Ordering
  search = ''
  private perspective: Perspective = perspectiveAtom.get()
  private generation = 0
  private pages = new Set<number>()
  /** Whether rows come from the API, rather than from the replica. */
  private remote = true
  private readonly titleField: string | undefined

  constructor(readonly typeName: string) {
    this.titleField = schema().preview(typeName).title
    const stored = storageGet(`js-lite-studio:order:${typeName}`)
    this.ordering = ORDERINGS.includes(stored as Ordering) ? (stored as Ordering) : 'updated'
  }

  private groq(page: number): [string, Record<string, unknown>] {
    const params: Record<string, unknown> = {type: this.typeName}
    let filter = '_type == $type'
    const search = this.search.trim()
    if (search) {
      filter += ` && ${this.titleField ?? '_id'} match $q`
      params.q = `${search}*`
    }
    const start = page * PAGE
    return [
      `{"total": count(*[${filter}]), "rows": *[${filter}] | order(${orderingGroq(this.ordering, this.titleField)}) [${start}...${start + PAGE}]._id}`,
      params,
    ]
  }

  private async load(page: number, first: boolean): Promise<void> {
    const generation = this.generation
    const perspective = this.perspective
    const started = performance.now()
    const [groq, params] = this.groq(page)
    let value: {total?: number; rows?: unknown[]} | undefined
    for (let attempt = 0; ; attempt++) {
      try {
        value = await client().fetch(groq, params, {
          perspective: queryPerspective(perspective) as never,
          tag: 'document-list',
        })
        break
      } catch (error) {
        if (generation !== this.generation) return
        if (attempt < PAGE_RETRIES) {
          await sleep(1000 << attempt)
          if (generation !== this.generation) return
          continue
        }
        // The page loads again when the list scrolls, and the rows shown stay.
        this.pages.delete(page)
        if (this.state.get().total !== undefined) toastError('Could not load documents', error)
        else this.state.update((state) => ({...state, error: errorMessage(error)}))
        return
      }
    }
    if (generation !== this.generation) return
    const total = value?.total ?? 0
    const pageRows = (value?.rows ?? []).flatMap((id) =>
      typeof id === 'string' ? [publishedId(id)] : [],
    )
    if (page === 0) replica.prefetch(pageRows)
    if (first) perf.list.set(performance.now() - started)
    this.state.update((state) => {
      const rows = state.rows.slice(0, total)
      while (rows.length < total) rows.push(undefined)
      pageRows.forEach((row, offset) => {
        if (page * PAGE + offset < rows.length) rows[page * PAGE + offset] = row
      })
      return {...state, rows, total, error: undefined}
    })
  }

  /** Shows the first page of the list in `ordering`, filtered by `search`, in the perspective of
   * the `param`, from the API when `remote`. */
  configure(ordering: Ordering, search: string, param: string | undefined, remote: boolean): void {
    this.ordering = ordering
    this.search = search
    this.perspective = parsePerspective(param)
    this.remote = remote
    this.reset()
  }

  /** Stops or starts the API pages. The type finishing its warm-up keeps the scroll position. */
  setRemote(remote: boolean): void {
    if (remote === this.remote) return
    this.remote = remote
    if (remote) this.reset()
    else this.generation++
  }

  reset(): void {
    this.generation++
    this.pages = new Set([0])
    this.state.update((state) => ({
      rows: [],
      total: undefined,
      error: undefined,
      scrollReset: state.scrollReset + 1,
    }))
    if (this.remote) void this.load(0, true)
  }

  ensure([start, end]: [number, number]): void {
    if (end === 0 || !this.remote) return
    for (let page = Math.floor(start / PAGE); page <= Math.floor((end - 1) / PAGE); page++) {
      if (this.pages.has(page)) continue
      this.pages.add(page)
      void this.load(page, false)
    }
  }

  /** Refetches the pages in view after a change, so moved, added and removed documents land
   * where the query puts them. */
  refresh(): void {
    if (!this.remote) return
    const dropped = [...this.pages].filter((page) => page >= LIVE_PAGES)
    if (dropped.length > 0) {
      for (const page of dropped) this.pages.delete(page)
      this.state.update((state) => {
        const rows = [...state.rows]
        for (const page of dropped) rows.fill(undefined, page * PAGE, page * PAGE + PAGE)
        return {...state, rows}
      })
    }
    for (const page of this.pages) void this.load(page, false)
  }
}

export function DocumentListPane(props: {typeName: string}) {
  const {typeName} = props
  const [controller] = useState(() => new ListController(typeName))
  const state = useAtom(controller.state)
  const perspective = useAtom(perspectiveAtom)
  const [ordering, setOrderingState] = useState(controller.ordering)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sortOpen, setSortOpen] = useState(false)
  const [sortButton, setSortButton] = useState<HTMLElement | null>(null)
  const [sortPopover, setSortPopover] = useState<HTMLElement | null>(null)
  useDismiss(
    sortOpen,
    () => setSortOpen(false),
    () => [sortButton, sortPopover],
  )
  const title = schema().typeTitle(typeName)
  const param = perspectiveParam(perspective)
  const listGeneration = replica.useListGeneration(typeName)
  const local = useMemo(
    () =>
      listAt(listGeneration, () =>
        replica.cachedList(typeName, parsePerspective(param), ordering, search),
      ),
    [listGeneration, typeName, param, ordering, search],
  )
  const warmed = local !== undefined
  const rows = local ?? state.rows
  const total = local ? local.length : state.total

  useEffect(() => replica.prioritize(typeName), [typeName])
  useEffect(() => {
    if (local) perf.list.set(replica.lastListMs())
    perf.listCached.set(local !== undefined)
  }, [local])

  useEffect(() => {
    controller.configure(ordering, search, param, !replica.isWarmed(typeName))
  }, [controller, ordering, search, param, typeName])
  useEffect(() => controller.setRemote(!warmed), [controller, warmed])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 200)
    return () => clearTimeout(timer)
  }, [searchInput])

  // The listener only says that something changed; one refresh covers a burst of events.
  useEffect(() => {
    let pending = false
    const subscription = client()
      .listen('*[_type == $type]', {type: typeName}, {
        includeResult: false,
        includeAllVersions: true,
        events: ['welcome', 'mutation', 'reconnect'],
        tag: 'document-list.listener',
      } as never)
      .subscribe({
        next: (event: {type: string; documentId?: string; reconnected?: boolean}) => {
          let changed = false
          if (event.type === 'mutation' && event.documentId) {
            const release = releaseOf(event.documentId)
            changed = release ? releaseName(perspectiveAtom.get()) === release : true
          } else if (event.type === 'welcome') {
            changed = event.reconnected === true
          }
          if (!changed || pending) return
          pending = true
          setTimeout(() => {
            pending = false
            controller.refresh()
          }, 300)
        },
        error: () => undefined,
      })
    return () => subscription.unsubscribe()
  }, [controller, typeName])

  const onRange = useCallback((range: [number, number]) => controller.ensure(range), [controller])

  const setOrdering = (next: Ordering) => {
    storageSet(`js-lite-studio:order:${typeName}`, next)
    setSortOpen(false)
    setOrderingState(next)
  }

  const create = () => {
    const id = store.create(typeName)
    navigate({typeName, documentId: id})
  }

  const searching = search.trim().length > 0
  let body
  if (total === 0) {
    body = (
      <Box padding={4}>
        <Text size={1} muted align="center">
          {searching ? 'No matching documents' : 'No documents of this type'}
        </Text>
      </Box>
    )
  } else if (total !== undefined) {
    body = (
      <VirtualList
        items={rows}
        rowHeight={ROW_HEIGHT}
        rowKey={(row) => row ?? 'skeleton'}
        render={(row) => <ListRow id={row} typeName={typeName} />}
        onRange={onRange}
        scrollReset={state.scrollReset}
      />
    )
  } else if (state.error) {
    body = (
      <Box padding={4}>
        <Card tone="critical" radius={2} padding={3}>
          <Stack gap={3}>
            <Text size={1}>{state.error}</Text>
            <Flex>
              <Button
                mode="ghost"
                icon={SyncIcon}
                text="Retry"
                onClick={() => controller.reset()}
              />
            </Flex>
          </Stack>
        </Card>
      </Box>
    )
  } else {
    body = (
      <Box paddingX={2}>
        {Array.from({length: 12}, (_, index) => (
          <ListRow key={index} id={undefined} typeName="" />
        ))}
      </Box>
    )
  }

  return (
    <Flex direction="column" height="fill">
      <Box padding={2} style={{flex: 'none'}}>
        <Flex align="center" gap={1}>
          <Box flex={1} padding={2}>
            <Text size={1} weight="semibold" textOverflow="ellipsis">
              {title}
            </Text>
          </Box>
          <Popover
            open={sortOpen}
            placement="bottom-end"
            portal
            ref={setSortPopover}
            content={
              <div style={{minWidth: 200}}>
                <Menu>
                  {ORDERINGS.map((value) => (
                    <MenuItem
                      key={value}
                      text={`Sort by ${ORDERING_TITLES[value]}`}
                      icon={SortIcon}
                      selected={ordering === value}
                      onClick={() => setOrdering(value)}
                    />
                  ))}
                </Menu>
              </div>
            }
          >
            <Button
              mode="bleed"
              icon={SortIcon}
              title="Sort"
              selected={sortOpen}
              ref={setSortButton}
              onClick={() => setSortOpen((open) => !open)}
            />
          </Popover>
          <Button mode="bleed" icon={ComposeIcon} title={`Create new ${title}`} onClick={create} />
        </Flex>
        <Box paddingY={1}>
          <TextInput
            value={searchInput}
            onChange={(event) => setSearchInput(event.currentTarget.value)}
            placeholder="Search list"
            icon={SearchIcon}
            fontSize={1}
          />
        </Box>
      </Box>
      <Box flex={1} overflow="hidden" style={{minHeight: 0}}>
        {body}
      </Box>
      {total === undefined ? null : (
        <Box padding={2} style={{flex: 'none', borderTop: '1px solid var(--card-border-color)'}}>
          <Text size={0} muted align="center">
            {`${total.toLocaleString('en-US')} documents · ${warmed ? 'in memory' : 'paged from the API'}`}
          </Text>
        </Box>
      )}
    </Flex>
  )
}

export function MediaBox(props: {media: string | undefined; size: number}) {
  const {media, size} = props
  const image = media ? imageUrl(media, size * 2) : undefined
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: '0.1875rem',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--card-muted-bg-color)',
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          width={size}
          height={size}
          style={{display: 'block', objectFit: 'cover'}}
        />
      ) : (
        <Text size={1} muted>
          <DocumentIcon />
        </Text>
      )}
    </span>
  )
}

export function StatusDot(props: {draft: boolean}) {
  const [color, title] = props.draft
    ? ['var(--card-badge-caution-dot-color)', 'Has unpublished changes']
    : ['var(--card-badge-positive-dot-color)', 'Published']
  return (
    <span
      title={title}
      style={{width: 9, height: 9, borderRadius: 9999, flex: 'none', backgroundColor: color}}
    />
  )
}

/** Media, title, subtitle (or when it was edited) and the publish status of a document. */
export function PreviewContent(props: {preview: DocPreview}) {
  const {preview} = props
  const subtitle = preview.subtitle ?? (preview.updatedAt ? timeAgo(preview.updatedAt) : '')
  return (
    <Flex align="center" gap={2}>
      <MediaBox media={preview.media} size={33} />
      <Stack gap={2} flex={1}>
        <Text size={1} weight="medium" textOverflow="ellipsis">
          {preview.title ?? 'Untitled'}
        </Text>
        <Text size={1} muted textOverflow="ellipsis">
          {subtitle}
        </Text>
      </Stack>
      <StatusDot draft={preview.draft} />
    </Flex>
  )
}

/** The React Compiler memoizes a call on its arguments, so `read()` must take the generation of
 * the replica it reads to run again when it changes. */
function listAt<T>(_generation: number, read: () => T): T {
  return read()
}

const skeletonContent = (
  <Flex align="center" gap={2}>
    <Skeleton style={{width: 33, height: 33}} radius={1} animated />
    <Stack gap={2} flex={1}>
      <Skeleton style={{width: '60%', height: '0.8125rem'}} animated />
      <Skeleton style={{width: '35%', height: '0.8125rem'}} animated />
    </Stack>
  </Flex>
)

/** The row of a page that has not loaded, whose document is not known yet. */
const rowSkeleton = (
  <Box padding={2} style={{height: ROW_HEIGHT}}>
    {skeletonContent}
  </Box>
)

/** A row shows its document once the open document pane or the replica holds every document of
 * its group, and a skeleton until then, which asks the replica to fetch the group. The skeleton
 * links to the document too, which opens with the loading state of a document not held yet. A
 * row of a group restored from the last visit shows it faded in and out until it is checked,
 * and asks for it too. */
function ListRow(props: {id: string | undefined; typeName: string}) {
  const {id, typeName} = props
  const current = useAtom(route)
  const perspective = useAtom(perspectiveAtom)
  const rowGeneration = replica.useRowGeneration(id ? typeName : '')
  const local = store.useDocuments(
    id ? [draftId(id), id] : [],
    () => (id ? localPreview(id, perspective) : undefined),
    id,
  )
  const cached = listAt(rowGeneration, () =>
    id && !local ? replica.cachedPreview(id, perspective) : undefined,
  )
  const preview = local ?? cached
  const missing = id !== undefined && (preview === undefined || preview.stale === true)
  useEffect(() => {
    if (!missing || !id) return undefined
    replica.want(id)
    return () => replica.unwant(id)
  }, [missing, id])
  if (!id) return rowSkeleton
  const target = {typeName, documentId: id}
  return (
    <Box paddingX={2}>
      <Card
        as="a"
        href={routeHref(target)}
        radius={2}
        padding={2}
        selected={current.documentId === id}
        onClick={linkClick(target)}
      >
        {preview?.stale ? (
          <div data-stale="">
            <PreviewContent preview={preview} />
          </div>
        ) : preview ? (
          <PreviewContent preview={preview} />
        ) : (
          skeletonContent
        )}
      </Card>
    </Box>
  )
}
