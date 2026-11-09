import {type ReleaseDocument} from '@sanity/client'
import {DotIcon} from '@sanity/icons/Dot'
import {useCallback, useMemo, useState} from 'react'
import {
  DEFAULT_VARIANT_TYPE_KEY,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  isCardinalityOneRelease,
  isReleaseDocument,
  ReleaseAvatar,
  ReleaseAvatarIcon,
  useActiveReleases,
  useDocumentVersions,
  useFormatRelativeLocalePublishDate,
  useGetDefaultPerspective,
  usePerspective,
  useReleasesToolAvailable,
  useTranslation,
  useWorkspace,
} from 'sanity'

import {MenuItem} from '../../../../../../../ui-components/menuItem/MenuItem'
import {usePerspectiveNavigator} from '../../../../../../hooks/usePerspectiveNavigator'
import {structureLocaleNamespace} from '../../../../../../i18n'
import {useDocumentPane} from '../../../../useDocumentPane'
import {getNavigationBadges} from '../badges/getNavigationBadges'
import {DropdownButton} from '../DropdownButton'
import {DocumentNavigationMenu} from '../menu/DocumentNavigationMenu'
import {useSelectedVariant} from '../variants/useSelectedVariant'

function ReleaseMenuItem(props: {
  isSelected: boolean
  onSelect: (release: ReleaseDocument) => void
  release: ReleaseDocument
}) {
  const {isSelected, onSelect, release} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tStudio} = useTranslation()
  const formatPublishDate = useFormatRelativeLocalePublishDate()
  const handleClick = useCallback(() => onSelect(release), [onSelect, release])

  const title = release.metadata.title || tStudio('release.placeholder-untitled-release')
  const hasPublishDate =
    release.metadata.releaseType === 'scheduled' &&
    Boolean(release.publishAt || release.metadata.intendedPublishAt)

  return (
    <MenuItem
      data-testid={`document-release-${getReleaseIdFromReleaseDocumentId(release._id)}`}
      icon={<ReleaseAvatar padding={0} release={release} />}
      onClick={handleClick}
      pressed={isSelected}
      selected={isSelected}
      text={
        hasPublishDate
          ? t('document-panel-navigation.releases.item.title-with-date', {
              title,
              date: formatPublishDate(release),
            })
          : title
      }
    />
  )
}

/**
 * Picks the release the studio is working in. Lists the releases the selected variant of the
 * document (Default when none is selected) has a version in, and the other releases. Picking one
 * changes the global perspective. Renders only when releases are enabled and at least one exists.
 *
 * @internal
 */
export function DocumentReleasesMenu() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tStudio} = useTranslation()
  const isReleasesEnabled = Boolean(useWorkspace().releases?.enabled)
  const isReleasesToolAvailable = useReleasesToolAvailable()
  const {documentId} = useDocumentPane()
  const {versions} = useDocumentVersions({documentId: getPublishedId(documentId)})
  const {data: activeReleases} = useActiveReleases()
  const {selectedPerspective, selectedReleaseId} = usePerspective()
  const selectedVariant = useSelectedVariant(DEFAULT_VARIANT_TYPE_KEY)
  const defaultPerspective = useGetDefaultPerspective()
  const {navigate} = usePerspectiveNavigator()
  const [filterQuery, setFilterQuery] = useState('')

  // Scheduled drafts have their own flow, and the navbar releases menu leaves them out too.
  const releases = useMemo(
    () => activeReleases.filter((release) => !isCardinalityOneRelease(release)),
    [activeReleases],
  )
  const variantId = selectedVariant?._id
  const documentReleaseIds = useMemo(
    () => new Set(getNavigationBadges({versions, variantId}).releaseIds),
    [variantId, versions],
  )
  const documentReleaseCount = useMemo(
    () =>
      releases.filter((release) =>
        documentReleaseIds.has(getReleaseIdFromReleaseDocumentId(release._id)),
      ).length,
    [documentReleaseIds, releases],
  )

  const untitledRelease = tStudio('release.placeholder-untitled-release')
  const {documentReleases, otherReleases} = useMemo(() => {
    const query = filterQuery.trim().toLowerCase()
    const inDocument: ReleaseDocument[] = []
    const others: ReleaseDocument[] = []
    for (const release of releases) {
      const title = release.metadata.title || untitledRelease
      if (query && !title.toLowerCase().includes(query)) continue
      if (documentReleaseIds.has(getReleaseIdFromReleaseDocumentId(release._id))) {
        inDocument.push(release)
      } else {
        others.push(release)
      }
    }
    return {documentReleases: inDocument, otherReleases: others}
  }, [documentReleaseIds, filterQuery, releases, untitledRelease])

  const handleSelectRelease = useCallback(
    (release: ReleaseDocument) => {
      navigate(release)
      setFilterQuery('')
    },
    [navigate],
  )
  const handleClear = useCallback(
    () => navigate(defaultPerspective),
    [defaultPerspective, navigate],
  )

  if (!isReleasesEnabled || !isReleasesToolAvailable || releases.length === 0) {
    return null
  }

  const selectedRelease =
    isReleaseDocument(selectedPerspective) && !isCardinalityOneRelease(selectedPerspective)
      ? selectedPerspective
      : undefined
  const renderReleaseItem = (release: ReleaseDocument) => (
    <ReleaseMenuItem
      isSelected={getReleaseIdFromReleaseDocumentId(release._id) === selectedReleaseId}
      key={release._id}
      onSelect={handleSelectRelease}
      release={release}
    />
  )

  return (
    <DocumentNavigationMenu
      testId="document-releases-menu"
      button={
        <DropdownButton
          data-testid="document-releases-menu-button"
          icon={selectedRelease ? <ReleaseAvatarIcon release={selectedRelease} size="small" /> : DotIcon}
          onClear={selectedRelease ? handleClear : undefined}
          tone={selectedRelease ? getReleaseTone(selectedRelease) : undefined}
          text={
            selectedRelease
              ? selectedRelease.metadata.title || untitledRelease
              : t('document-panel-navigation.releases.button.text')
          }
        />
      }
      filterPlaceholder={t('document-panel-navigation.releases.filter-placeholder')}
      filterQuery={filterQuery}
      onFilterChange={setFilterQuery}
      sections={[
        {
          key: 'document',
          label: t('document-panel-navigation.releases.section.in-releases', {
            count: documentReleaseCount,
          }),
          items: documentReleases.map(renderReleaseItem),
          alwaysShow: true,
          tooltip:
            documentReleaseCount === 0
              ? t('document-panel-navigation.releases.section.no-releases-tooltip')
              : undefined,
        },
        {
          key: 'other',
          label: t('document-panel-navigation.releases.section.other'),
          items: otherReleases.map(renderReleaseItem),
        },
      ]}
    />
  )
}
