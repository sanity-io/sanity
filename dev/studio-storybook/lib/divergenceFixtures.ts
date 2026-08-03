/**
 * Fixture world for Advanced Version Control divergences
 * (`advancedVersionControl.enabled`).
 *
 * In a real studio the divergence pipeline is: `_system.divergences` metadata →
 * `collateDocumentDivergences` → `useDivergenceNavigator` (transposes onto the
 * schema + form state) → indicators/detail. The first two stages need live
 * transaction history, so stories enter at the navigator seam instead:
 *
 * - {@link createFixtureDivergence} builds a `ReachableDivergence` the way
 *   `transposeSchema` would emit one — including resolving the SAME diff
 *   component (`resolveDiffComponent`) the real transposition resolves, so the
 *   detail panel renders the genuine field-diff UI.
 * - {@link useFixtureDivergenceNavigator} is a stateful, in-memory
 *   `DivergenceNavigator`: focus/blur/next/previous behave like the real
 *   reducer (cyclic paging, `withAddressablePaths` semantics).
 * - {@link createDivergenceFixtureClient} extends the structure fixture client
 *   with the ONE endpoint `useDivergenceController` fetches directly: the
 *   history API (`/data/history/<ds>/documents/<id>?revision=`), which serves
 *   the upstream document AT THE FORK POINT. The upstream HEAD is resolved by
 *   the real document store (`pair.editState`) against the same client's
 *   fixture snapshots — so the base→head diff shown in the panel is computed
 *   live by `@sanity/diff` from two fixture documents, not hardcoded.
 *
 * Scenario: `book-war` has an upstream copy in the "Spring campaign" release
 * (`versions.rScheduled.book-war`) that changed `title` and `subtitle` after
 * the "Hotfix launch" copy (`versions.rAsap.book-war`, the subject) forked
 * from it at `rev-war-fork-1`.
 */
import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type SchemaType} from '@sanity/types'
import {useMemo, useState} from 'react'
import {type Observable, of} from 'rxjs'

import {
  type DivergenceNavigator,
  type DivergenceNavigatorState,
  type ReachableDivergence,
  type ReachableDivergenceAtPath,
} from '../../../packages/sanity/src/core/divergence/divergenceNavigator'
import {type Divergence} from '../../../packages/sanity/src/core/divergence/readDocumentDivergences'
import {resolveDiffComponent} from '../../../packages/sanity/src/core/field/diff/resolve/resolveDiffComponent'
import {createStructureFixtureClient} from './structureHarness'

/** The upstream (fork base) document id — the Spring campaign release copy. */
export const DIVERGENCE_UPSTREAM_ID = 'versions.rScheduled.book-war'
/** The subject document id — the Hotfix launch copy that forked from upstream. */
export const DIVERGENCE_SUBJECT_ID = 'versions.rAsap.book-war'
/** The upstream revision the subject forked at (history endpoint serves it). */
export const DIVERGENCE_FORK_REVISION = 'rev-war-fork-1'

/**
 * Documents the real document-store pair resolves during divergence review:
 * upstream head (new values), subject (the diverged copy), published base.
 */
export const divergenceFixtureDocuments: SanityDocument[] = [
  {
    _id: 'book-war',
    _type: 'book',
    _rev: 'rev-war-pub-3',
    _createdAt: '2026-03-01T09:00:00Z',
    _updatedAt: '2026-06-10T09:00:00Z',
    title: 'War and Peace',
    subtitle: 'A novel in four volumes',
  },
  {
    _id: DIVERGENCE_UPSTREAM_ID,
    _type: 'book',
    _rev: 'rev-war-sched-7',
    _createdAt: '2026-06-20T09:00:00Z',
    _updatedAt: '2026-07-21T14:00:00Z',
    title: 'War and Peace: The Annotated Edition',
    subtitle: 'A historical novel in four volumes',
  },
  {
    _id: DIVERGENCE_SUBJECT_ID,
    _type: 'book',
    _rev: 'rev-war-asap-4',
    _createdAt: '2026-06-25T09:00:00Z',
    _updatedAt: '2026-07-20T10:00:00Z',
    title: 'War and Peace',
    subtitle: 'A novel in four volumes — hotfix copy',
  },
]

/**
 * Revision snapshots served by the history endpoint, keyed
 * `<documentId>@<revisionId>`. The fork-point snapshot carries the OLD values,
 * so the panel's diff (fork base → upstream head) shows both field changes.
 */
export const divergenceFixtureRevisions: Record<string, SanityDocument> = {
  [`${DIVERGENCE_UPSTREAM_ID}@${DIVERGENCE_FORK_REVISION}`]: {
    _id: DIVERGENCE_UPSTREAM_ID,
    _type: 'book',
    _rev: DIVERGENCE_FORK_REVISION,
    _createdAt: '2026-06-20T09:00:00Z',
    _updatedAt: '2026-06-20T09:00:00Z',
    title: 'War and Peace',
    subtitle: 'A novel in four volumes',
  },
}

export interface DivergenceFixtureClientOptions {
  /** Documents behind the document store pair (snapshots, availability). */
  documents: SanityDocument[]
  /** History snapshots keyed `<documentId>@<revisionId>`. */
  revisions: Record<string, SanityDocument>
}

/**
 * `createStructureFixtureClient` extended with the history endpoint
 * `getDocumentAtRevision` fetches (`observable.request({url})`). Unknown
 * requests fall through to the structure client's handlers.
 */
export function createDivergenceFixtureClient(
  options: DivergenceFixtureClientOptions,
): SanityClient {
  const base = createStructureFixtureClient({documents: options.documents})

  const request = (opts: {
    uri?: string
    url?: string
    method?: string
    body?: unknown
  }): Observable<unknown> => {
    const url = opts.url ?? opts.uri ?? ''
    const match = url.match(/\/data\/history\/[^/]+\/documents\/([^?]+)\?(.*)$/)
    if (match) {
      const revision = new URLSearchParams(match[2]).get('revision')
      const snapshot = options.revisions[`${decodeURIComponent(match[1])}@${revision}`]
      return of({documents: snapshot ? [snapshot] : []})
    }
    return (base.observable.request as (o: typeof opts) => Observable<unknown>)(opts)
  }

  const client = {
    ...base,
    observable: {...base.observable, request},
    withConfig: () => client,
  }

  return client as unknown as SanityClient
}

export interface FixtureDivergenceOptions {
  /** Stringified path to the diverged node (e.g. `'title'`). */
  path: string
  /** The field's compiled schema type — resolve it from the mock workspace. */
  schemaType: SchemaType
  documentType: string
  /** The upstream document id (defaults to the book-war scenario). */
  documentId?: string
  /** The subject document id (defaults to the book-war scenario). */
  subjectId?: string
  /** The upstream fork revision (defaults to the book-war scenario). */
  revisionId?: string
  status?: 'unresolved' | 'resolved'
}

const emptySnapshots: Divergence['snapshots'] = {
  subjectHead: undefined,
  upstreamHead: undefined,
  upstreamAtFork: undefined,
}

/**
 * A `ReachableDivergence` shaped as `transposeSchema` emits them for a leaf
 * primitive node: addressable, non-composite, self-contained `divergences`
 * list, and the diff component resolved through the real resolver.
 */
export function createFixtureDivergence(options: FixtureDivergenceOptions): ReachableDivergence {
  const {
    path,
    schemaType,
    documentType,
    documentId = DIVERGENCE_UPSTREAM_ID,
    subjectId = DIVERGENCE_SUBJECT_ID,
    revisionId = DIVERGENCE_FORK_REVISION,
    status = 'unresolved',
  } = options

  const base: Divergence = {
    snapshots: emptySnapshots,
    documentType,
    isAddressable: true,
    effect: 'set',
    documentId,
    subjectId,
    sinceRevisionId: `${documentId}@${revisionId}`,
    status,
    path,
  }

  return {
    ...base,
    isComposite: false,
    divergences: [[path, base]],
    diffComponent: resolveDiffComponent(schemaType),
    schemaType,
  }
}

/**
 * A stateful in-memory `DivergenceNavigator`. Focus/blur update React state;
 * previous/next are cyclic over the entry list, mirroring the real reducer's
 * `withAddressablePaths`. `divergencesByNode` maps each entry's path to its
 * inner divergence count (feeds the collection indicators).
 */
export function useFixtureDivergenceNavigator(
  entries: ReachableDivergenceAtPath[],
  upstreamId: string,
  initialFocus?: string,
): DivergenceNavigator {
  const [focusedPath, setFocusedPath] = useState<string | undefined>(initialFocus)

  return useMemo(() => {
    const index = entries.findIndex(([path]) => path === focusedPath)
    const focusedDivergence = index === -1 ? undefined : focusedPath
    const cyclic = (offset: number) =>
      entries.at((index + offset + entries.length) % entries.length)?.[0]

    const state: DivergenceNavigatorState = {
      focusedDivergence,
      previousDivergence: focusedDivergence ? cyclic(-1) : undefined,
      nextDivergence: focusedDivergence ? cyclic(1) : undefined,
      state: 'ready',
      upstreamId,
      allDivergences: entries.flatMap(([, divergence]) => divergence.divergences),
      divergences: entries,
      divergencesByNode: Object.fromEntries(
        entries.map(([path, divergence]) => [path, divergence.divergences.length]),
      ),
    }

    return {
      state,
      focusDivergence: (path: string) => setFocusedPath(path),
      blurDivergence: (path: string) =>
        setFocusedPath((current) => (current === path ? undefined : current)),
      blurFocusedDivergence: () => setFocusedPath(undefined),
    }
  }, [entries, focusedPath, upstreamId])
}
