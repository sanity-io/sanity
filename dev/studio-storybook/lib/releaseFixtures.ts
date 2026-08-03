import {type ReleaseDocument} from '@sanity/client'
import {type ValidationMarker} from '@sanity/types'

import {
  activeASAPErrorRelease,
  activeASAPRelease,
  activeCardinalityOneRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
  publishedASAPRelease,
  scheduledRelease,
} from '../../../packages/sanity/src/core/releases/__fixtures__/release.fixture'
import {type DocumentInRelease} from '../../../packages/sanity/src/core/releases/tool/detail/types'
import {type TableRelease} from '../../../packages/sanity/src/core/releases/tool/overview/ReleasesOverview'

/**
 * Fixtures for the Releases subsystem.
 *
 * Two things live here, and they exist for different reasons.
 *
 * 1. RELEASES. Upstream already ships nine of them in
 *    `core/releases/__fixtures__/release.fixture.ts`, covering every state a release can be in.
 *    We re-export them under names that read as states rather than as variable names, because a
 *    story title should say what it is showing. Do not hand-write releases: a `ReleaseDocument`
 *    that is subtly wrong (a `scheduled` state with no `publishAt`, say) makes a story that proves
 *    nothing, and the tone/icon utilities read more of the shape than you would guess.
 *
 * 2. DOCUMENTS IN A RELEASE. These we do have to build, and the reason is worth knowing before
 *    you reach for a mock store. `useReleaseDocuments` / `useBundleDocuments` do NOT read the
 *    mocked `ReleaseStore` at all: they run a live GROQ query and then validate each result
 *    document individually. So seeding the store gets you releases and nothing inside them.
 *
 *    The consequence is a clean split:
 *      - a component that takes `documents: DocumentInRelease[]` as a PROP is cheap - build the
 *        array here and hand it over;
 *      - a component that calls the hook itself (`ReleaseDetail`, `ReleaseSummary`) is expensive
 *        and needs the whole query path, which is out of scope for the storybook.
 *
 *    `BundleDocument` is a plain shape (a document, a validation status, a memo key), so building
 *    it by hand is honest rather than a stub: every consumer downstream reads exactly these
 *    fields.
 */

export const releaseFixtures = {
  /** Active, publishes as soon as it is released. Caution tone, bolt icon. */
  asap: activeASAPRelease,
  /** Active asap release that failed to publish - carries an `error`. */
  asapFailed: activeASAPErrorRelease,
  /** Active with an intended publish date. Suggest tone, clock icon. */
  scheduled: activeScheduledRelease,
  /** Actually scheduled (state `scheduled`), so it is locked. */
  scheduledLocked: scheduledRelease,
  /** Active with no date decided. Neutral tone, dot icon. */
  undecided: activeUndecidedRelease,
  /** A single-document scheduled draft (cardinality `one`), which reads as paused. */
  scheduledDraft: activeCardinalityOneRelease,
  /** Archived. Tone collapses to default whatever the release type was. */
  archived: archivedScheduledRelease,
  /** Published. */
  published: publishedASAPRelease,
} satisfies Record<string, ReleaseDocument>

/** The whole set, in the order the overview table would show them. */
export const allReleaseFixtures: ReleaseDocument[] = [
  releaseFixtures.asap,
  releaseFixtures.scheduled,
  releaseFixtures.scheduledLocked,
  releaseFixtures.undecided,
  releaseFixtures.scheduledDraft,
  releaseFixtures.archived,
  releaseFixtures.published,
]

/**
 * Widen a release into the shape the overview table renders.
 *
 * `TableRelease` is a `ReleaseDocument` plus two view-only fields: `documentsMetadata` (the
 * counts and last-activity timestamp the table columns show) and `isDeleted` (a release that
 * vanished underneath an open table, which renders as a transparent row with a tooltip).
 */
export function asTableRelease(
  release: ReleaseDocument,
  extra: Partial<Pick<TableRelease, 'documentsMetadata' | 'isDeleted'>> = {},
): TableRelease {
  return {...release, ...extra}
}

let documentCounter = 0

export interface DocumentInReleaseOptions {
  /** Document id. Defaults to a generated one, which is fine unless a story needs to name it. */
  id?: string
  /** Schema type name. Defaults to `book`, which the storybook schema fixtures define. */
  type?: string
  title?: string
  /** Still being validated - the state the detail screen opens in. */
  validating?: boolean
  /** Validation markers to attach. Any `error`-level marker also sets `hasError`. */
  validation?: ValidationMarker[]
  /** Marks the document for unpublishing (`_system.delete`), which skips validation entirely. */
  goingToUnpublish?: boolean
  /** A row that has been added to the release but not yet committed. */
  isPending?: boolean
  publishedDocumentExists?: boolean
  draftDocumentExists?: boolean
  /** Extra fields merged onto the document body. */
  document?: Record<string, unknown>
}

/**
 * Build one `DocumentInRelease`.
 *
 * Note `hasError` is DERIVED from the markers rather than passed separately. Upstream computes it
 * the same way, and letting a story set `hasError: true` with no markers produces a component
 * showing an error count with nothing to show for it - a fixture that lies.
 */
export function createDocumentInRelease(options: DocumentInReleaseOptions = {}): DocumentInRelease {
  const {
    id = `doc-${++documentCounter}`,
    type = 'book',
    title,
    validating = false,
    validation = [],
    goingToUnpublish = false,
    isPending,
    publishedDocumentExists = true,
    draftDocumentExists,
    document = {},
  } = options

  return {
    memoKey: `${id}-memo`,
    ...(typeof isPending === 'boolean' ? {isPending} : {}),
    document: {
      _id: id,
      _type: type,
      _rev: `${id}-rev`,
      _createdAt: '2026-07-01T09:00:00Z',
      _updatedAt: '2026-07-20T14:30:00Z',
      ...(title ? {title} : {}),
      ...(goingToUnpublish ? {_system: {delete: true}} : {}),
      publishedDocumentExists,
      ...(typeof draftDocumentExists === 'boolean' ? {draftDocumentExists} : {}),
      ...document,
    },
    validation: {
      isValidating: validating,
      validation,
      hasError: validation.some((marker) => marker.level === 'error'),
    },
  }
}

/** A validation error marker on a named field, for the error states. */
export function validationError(path: string, message: string): ValidationMarker {
  return {level: 'error', message, path: [path]}
}

/**
 * A release's worth of documents in a given validation phase.
 *
 * The three phases are the ones the progress indicator distinguishes, and they are genuinely
 * different states rather than three renders of one: `validating` counts partial progress,
 * `valid` transitions to a checkmark on a 2.5s delay, and `errors` never transitions at all.
 */
export const documentsInRelease = {
  /** Half validated, half still going - what the detail screen shows on open. */
  validating(): DocumentInRelease[] {
    return [
      createDocumentInRelease({title: 'Anna Karenina'}),
      createDocumentInRelease({title: 'War and Peace'}),
      createDocumentInRelease({title: 'The Kreutzer Sonata', validating: true}),
      createDocumentInRelease({title: 'Resurrection', validating: true}),
    ]
  },
  /** Every document validated clean. */
  valid(): DocumentInRelease[] {
    return [
      createDocumentInRelease({title: 'Anna Karenina'}),
      createDocumentInRelease({title: 'War and Peace'}),
      createDocumentInRelease({title: 'The Kreutzer Sonata'}),
    ]
  },
  /** One document blocks the release. */
  withErrors(): DocumentInRelease[] {
    return [
      createDocumentInRelease({title: 'Anna Karenina'}),
      createDocumentInRelease({
        title: 'War and Peace',
        validation: [validationError('author', 'Required - every book needs an author')],
      }),
      createDocumentInRelease({title: 'The Kreutzer Sonata'}),
    ]
  },
  /** Documents marked for unpublishing, which are counted as validated without being validated. */
  goingToUnpublish(): DocumentInRelease[] {
    return [
      createDocumentInRelease({title: 'Anna Karenina'}),
      createDocumentInRelease({title: 'Persuasion', goingToUnpublish: true}),
    ]
  },
}
