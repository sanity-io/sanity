import {type ReleaseDocument} from '@sanity/client'
import {UnlockIcon} from '@sanity/icons/Unlock'
import {useCallback, useMemo, useState} from 'react'
import {
  DEFAULT_VARIANT_TYPE_KEY,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  isCardinalityOneRelease,
  isPausedCardinalityOneRelease,
  isReleaseDocument,
  ReleaseAvatar,
  useActiveReleases,
  useDocumentVersions,
  usePerspective,
  useScheduledDraftsEnabled,
  useTranslation,
} from 'sanity'

import {MenuItem} from '../../../../../../../ui-components/menuItem/MenuItem'
import {usePaneRouter} from '../../../../../../components/paneRouter/usePaneRouter'
import {usePerspectiveNavigator} from '../../../../../../hooks/usePerspectiveNavigator'
import {structureLocaleNamespace} from '../../../../../../i18n'
import {useDocumentPane} from '../../../../useDocumentPane'
import {getNavigationBadges} from '../badges/getNavigationBadges'
import {ClockSmallIcon} from '../ClockSmallIcon'
import {DropdownButton} from '../DropdownButton'
import {DocumentNavigationMenu} from '../menu/DocumentNavigationMenu'
import {useSelectedVariant} from '../variants/useSelectedVariant'
import {getPublishDate, useFormatPublishDateTime} from './useFormatPublishDateTime'

/** When a scheduled draft goes out. Undated ones sort last. */
function getScheduledTime(release: ReleaseDocument): number {
  const date = getPublishDate(release)
  return date ? new Date(date).getTime() : Number.POSITIVE_INFINITY
}

function ScheduledDraftMenuItem(props: {
  isSelected: boolean
  label: string
  onSelect: (release: ReleaseDocument) => void
  release: ReleaseDocument
}) {
  const {isSelected, label, onSelect, release} = props
  const handleClick = useCallback(() => onSelect(release), [onSelect, release])

  return (
    <MenuItem
      data-testid={`document-scheduled-draft-${getReleaseIdFromReleaseDocumentId(release._id)}`}
      icon={<ReleaseAvatar padding={0} release={release} />}
      iconRight={isPausedCardinalityOneRelease(release) ? UnlockIcon : undefined}
      onClick={handleClick}
      pressed={isSelected}
      selected={isSelected}
      text={label}
    />
  )
}

/**
 * Opens one of the scheduled drafts of the selected variant of the document (Default when none
 * is selected) in this pane, listed by the date they go out. Renders only when scheduled drafts
 * are enabled and the variant has at least one.
 *
 * @internal
 */
export function DocumentScheduledDraftsMenu() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tStudio} = useTranslation()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const {documentId} = useDocumentPane()
  const {versions} = useDocumentVersions({documentId: getPublishedId(documentId)})
  const {data: activeReleases} = useActiveReleases()
  const {selectedPerspective} = usePerspective()
  const selectedVariant = useSelectedVariant(DEFAULT_VARIANT_TYPE_KEY)
  const formatPublishDateTime = useFormatPublishDateTime()
  const {navigate} = usePerspectiveNavigator()
  const {params, setParams} = usePaneRouter()
  const [filterQuery, setFilterQuery] = useState('')

  const variantId = selectedVariant?._id
  const scheduledDrafts = useMemo(() => {
    const documentReleaseIds = new Set(getNavigationBadges({versions, variantId}).releaseIds)
    return activeReleases
      .filter(
        (release) =>
          isCardinalityOneRelease(release) &&
          documentReleaseIds.has(getReleaseIdFromReleaseDocumentId(release._id)),
      )
      .toSorted((a, b) => getScheduledTime(a) - getScheduledTime(b))
  }, [activeReleases, variantId, versions])

  const untitledRelease = tStudio('release.placeholder-untitled-release')
  const getLabel = useCallback(
    (release: ReleaseDocument) => formatPublishDateTime(release) ?? untitledRelease,
    [formatPublishDateTime, untitledRelease],
  )
  const visibleScheduledDrafts = useMemo(() => {
    const query = filterQuery.trim().toLowerCase()
    if (!query) return scheduledDrafts
    return scheduledDrafts.filter((release) => getLabel(release).toLowerCase().includes(query))
  }, [filterQuery, getLabel, scheduledDrafts])

  const handleSelect = useCallback(
    (release: ReleaseDocument) => {
      navigate(release)
      setFilterQuery('')
    },
    [navigate],
  )
  // Drop the pane param only. `onSetScheduledDraftPerspective` also clears the global
  // perspective, which is what opening a scheduled draft does so it does not stay inside a release.
  const handleClear = useCallback(() => {
    setParams({...params, scheduledDraft: undefined})
  }, [params, setParams])

  if (!isScheduledDraftsEnabled || scheduledDrafts.length === 0) {
    return null
  }

  const selectedScheduledDraft =
    isReleaseDocument(selectedPerspective) && isCardinalityOneRelease(selectedPerspective)
      ? selectedPerspective
      : undefined

  return (
    <DocumentNavigationMenu
      testId="document-scheduled-drafts-menu"
      button={
        <DropdownButton
          data-testid="document-scheduled-drafts-menu-button"
          icon={isPausedCardinalityOneRelease(selectedScheduledDraft) ? UnlockIcon : ClockSmallIcon}
          onClear={selectedScheduledDraft ? handleClear : undefined}
          tone={selectedScheduledDraft ? getReleaseTone(selectedScheduledDraft) : undefined}
          text={
            selectedScheduledDraft
              ? getLabel(selectedScheduledDraft)
              : t('document-panel-navigation.scheduled-drafts.button.text')
          }
        />
      }
      filterPlaceholder={t('document-panel-navigation.scheduled-drafts.filter-placeholder')}
      filterQuery={filterQuery}
      onFilterChange={setFilterQuery}
      sections={[
        {
          key: 'scheduled',
          label: t('document-panel-navigation.scheduled-drafts.section.scheduled-for'),
          items: visibleScheduledDrafts.map((release) => (
            <ScheduledDraftMenuItem
              isSelected={selectedScheduledDraft?._id === release._id}
              key={release._id}
              label={getLabel(release)}
              onSelect={handleSelect}
              release={release}
            />
          )),
        },
      ]}
    />
  )
}
