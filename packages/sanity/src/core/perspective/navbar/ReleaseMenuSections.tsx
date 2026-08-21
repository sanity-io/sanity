import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {useMemo} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersionTypeSortedList} from '../../releases/hooks/useDocumentVersionTypeSortedList'
import {ORDERED_RELEASE_TYPES} from '../../releases/util/const'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'

const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  asap: 'release.type.asap',
  scheduled: 'release.type.scheduled',
  undecided: 'release.type.undecided',
}

function groupByReleaseType(releases: ReleaseDocument[]): Record<ReleaseType, ReleaseDocument[]> {
  return ORDERED_RELEASE_TYPES.reduce<Record<ReleaseType, ReleaseDocument[]>>(
    (grouped, releaseType) => ({
      ...grouped,
      [releaseType]: releases.filter(({metadata}) => metadata.releaseType === releaseType),
    }),
    {} as Record<ReleaseType, ReleaseDocument[]>,
  )
}

interface SectionsProps {
  releases: ReleaseDocument[]
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}

/**
 * The list as it reads with no document selected: one labelled group per release
 * type.
 */
export function ReleaseTypeSections({releases, menuItemProps}: SectionsProps): React.JSX.Element {
  const {t} = useTranslation()
  const grouped = useMemo(() => groupByReleaseType(releases), [releases])

  return (
    <>
      {ORDERED_RELEASE_TYPES.map((releaseType) => (
        <ReleaseTypeMenuSection
          key={releaseType}
          data-testid={`release-menu-section-${releaseType}`}
          heading={t(RELEASE_TYPE_LABELS[releaseType])}
          releases={grouped[releaseType]}
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
function OtherReleaseSections({releases, menuItemProps}: SectionsProps): React.JSX.Element {
  const {t} = useTranslation()
  const grouped = useMemo(() => groupByReleaseType(releases), [releases])
  const firstNonEmptyType = ORDERED_RELEASE_TYPES.find((type) => grouped[type].length > 0)

  return (
    <>
      {ORDERED_RELEASE_TYPES.map((releaseType) => (
        <ReleaseTypeMenuSection
          key={releaseType}
          data-testid={`release-menu-section-other-${releaseType}`}
          heading={releaseType === firstNonEmptyType ? t('release.menu.other-releases') : undefined}
          releases={grouped[releaseType]}
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
    return <ReleaseTypeSections releases={releases} menuItemProps={menuItemProps} />
  }

  return (
    <>
      <ReleaseTypeMenuSection
        data-testid="release-menu-section-part-of"
        heading={t('release.menu.part-of-releases', {count: partOf.length})}
        releases={partOf}
        menuItemProps={menuItemProps}
      />
      <OtherReleaseSections releases={others} menuItemProps={menuItemProps} />
    </>
  )
}
