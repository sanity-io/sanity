import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersionTypeSortedList} from '../../releases/hooks/useDocumentVersionTypeSortedList'
import {rankReleasesForSearch} from '../../releases/util/filterReleasesForSearch'
import {
  groupReleasesByTimeBucket,
  ORDERED_RELEASE_TIME_BUCKETS,
  RELEASE_TIME_BUCKET_HEADING_THRESHOLD,
  RELEASE_TIME_BUCKET_LABELS,
} from '../../releases/util/getReleaseTimeBuckets'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'

interface SectionsProps {
  releases: ReleaseDocument[]
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  /**
   * The active filter term, or an empty string. While filtering, the time bands are replaced by a
   * single list ordered by how well each release matches: a filtered list is a set of results, and
   * banding them by date buries the best match among dates nobody asked about.
   */
  searchTerm?: string
}

/**
 * The list as it reads with no document selected: one sequence in time, banded by when each release
 * is due.
 *
 * The bands are labelled only past {@link RELEASE_TIME_BUCKET_HEADING_THRESHOLD}. A short list is
 * already scannable, and a heading over two rows explains less than it interrupts; a long one
 * cannot be read at a glance, which is the job a heading does. The order is the same either way, so
 * crossing the threshold adds labels rather than moving anything.
 */
export function ReleaseTypeSections({
  releases,
  menuItemProps,
  searchTerm = '',
}: SectionsProps): React.JSX.Element {
  const {t} = useTranslation()
  // Recomputed per render rather than memoised on a clock: the bands shift as time passes, and a
  // menu that is open across a boundary should not keep asserting the old one.
  const grouped = useMemo(() => groupReleasesByTimeBucket(releases, new Date()), [releases])
  const ranked = useMemo(() => rankReleasesForSearch(releases, searchTerm), [releases, searchTerm])
  const isFiltering = searchTerm.trim().length > 0
  const showHeadings = !isFiltering && releases.length >= RELEASE_TIME_BUCKET_HEADING_THRESHOLD

  if (isFiltering) {
    return (
      <ReleaseTypeMenuSection
        data-testid="release-menu-section-results"
        releases={ranked}
        menuItemProps={menuItemProps}
      />
    )
  }

  // Unlabelled means one section, not several with their labels removed. Each section is a card
  // with a bottom border, so keeping the bands while hiding their headings drew a divider between
  // every band — and a band often holds a single release, which made the short list read as a
  // stack of one-row groups divided for no stated reason.
  if (!showHeadings) {
    return (
      <ReleaseTypeMenuSection
        data-testid="release-menu-section-sequence"
        releases={ORDERED_RELEASE_TIME_BUCKETS.flatMap((bucket) => grouped[bucket])}
        menuItemProps={menuItemProps}
      />
    )
  }

  return (
    <>
      {ORDERED_RELEASE_TIME_BUCKETS.map((bucket) => (
        <ReleaseTypeMenuSection
          key={bucket}
          data-testid={`release-menu-section-${bucket}`}
          heading={showHeadings ? t(RELEASE_TIME_BUCKET_LABELS[bucket]) : undefined}
          releases={grouped[bucket]}
          menuItemProps={menuItemProps}
        />
      ))}
    </>
  )
}

/**
 * The releases the selected document has no version in. Still grouped by type so
 * the ordering matches the default layout, but only the first non-empty group
 * carries a heading — the rest are separated by their card border alone, which is
 * what the design asks for.
 */
function OtherReleaseSections({
  releases,
  menuItemProps,
  searchTerm = '',
}: SectionsProps): React.JSX.Element {
  const {t} = useTranslation()
  const grouped = useMemo(() => groupReleasesByTimeBucket(releases, new Date()), [releases])
  const ranked = useMemo(() => rankReleasesForSearch(releases, searchTerm), [releases, searchTerm])
  const firstNonEmpty = ORDERED_RELEASE_TIME_BUCKETS.find((bucket) => grouped[bucket].length > 0)

  // The part-of / other split survives filtering — it answers a different question from the bands,
  // and which releases hold a version of the open document stays worth knowing while searching.
  if (searchTerm.trim().length > 0) {
    return (
      <ReleaseTypeMenuSection
        data-testid="release-menu-section-other-results"
        heading={t('release.menu.other-releases')}
        releases={ranked}
        menuItemProps={menuItemProps}
      />
    )
  }

  return (
    <>
      {ORDERED_RELEASE_TIME_BUCKETS.map((bucket) => (
        <ReleaseTypeMenuSection
          key={bucket}
          data-testid={`release-menu-section-other-${bucket}`}
          heading={bucket === firstNonEmpty ? t('release.menu.other-releases') : undefined}
          releases={grouped[bucket]}
          menuItemProps={menuItemProps}
        />
      ))}
    </>
  )
}

/**
 * The list as it reads with a document selected: the releases that already hold a
 * version of it, then everything else.
 *
 * Mounted only when there is an active document, so `useDocumentVersionTypeSortedList`
 * is never called with an empty id — it would otherwise open a version
 * subscription for `''`.
 */
export function DocumentReleaseSections({
  documentId,
  releases,
  menuItemProps,
  searchTerm = '',
}: SectionsProps & {documentId: string}): React.JSX.Element {
  const {t} = useTranslation()
  const {sortedDocumentList} = useDocumentVersionTypeSortedList({documentId})

  const [partOf, others] = useMemo(() => {
    // Intersect against `releases` rather than using `sortedDocumentList`
    // directly: the caller has already dropped scheduled-draft releases and
    // applied the filter query, and neither is reflected in the hook's result.
    const visibleIds = new Set(releases.map(({_id}) => _id))
    const partOfIds = new Set(sortedDocumentList.map(({_id}) => _id))

    return [
      sortedDocumentList.filter(({_id}) => visibleIds.has(_id)),
      releases.filter(({_id}) => !partOfIds.has(_id)),
    ]
  }, [releases, sortedDocumentList])

  // A document with no versions reads exactly like no document at all.
  if (partOf.length === 0) {
    return (
      <ReleaseTypeSections
        releases={releases}
        menuItemProps={menuItemProps}
        searchTerm={searchTerm}
      />
    )
  }

  return (
    <>
      <ReleaseTypeMenuSection
        data-testid="release-menu-section-part-of"
        heading={t('release.menu.part-of-releases', {count: partOf.length})}
        releases={rankReleasesForSearch(partOf, searchTerm)}
        menuItemProps={menuItemProps}
      />
      <OtherReleaseSections
        releases={others}
        menuItemProps={menuItemProps}
        searchTerm={searchTerm}
      />
    </>
  )
}
