import {Stack, Text} from '@sanity/ui'
import {memo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  isGoingToUnpublish,
  isReleaseScheduledOrScheduling,
  type ReleaseDocument,
  ReleaseTitle,
  type SanityDocumentLike,
  Translate,
  useActiveReleases,
  useDateTimeFormat,
  type UseDateTimeFormatOptions,
  useFormatRelativeLocalePublishDate,
  usePerspective,
  useTranslation,
  VersionChip,
  getVersionFromId,
} from 'sanity'

import {useDocumentPerspectiveList} from '../../../../../hooks/useDocumentPerspectiveList'
import {useDocumentPane} from '../../../useDocumentPane'
import {useDocumentPaneInfo} from '../../../useDocumentPaneInfo'
import {NonReleaseVersionsSelect} from '../NonReleaseVersionsSelect'

const TooltipContent = ({release}: {release: ReleaseDocument}) => {
  const {t} = useTranslation()
  const formatPublishDate = useFormatRelativeLocalePublishDate()

  if (release.state === 'archived') {
    return <Text size={1}>{t('release.chip.tooltip.archived')}</Text>
  }
  if (release.metadata.releaseType === 'asap') {
    return <Text size={1}>{t('release.type.asap')}</Text>
  }
  if (release.metadata.releaseType === 'scheduled') {
    const isActive = release.state === 'active'

    return (
      release.metadata.intendedPublishAt && (
        <Text size={1}>
          {isActive ? (
            <Translate
              t={t}
              i18nKey="release.chip.tooltip.intended-for-date"
              values={{
                date: formatPublishDate(release),
              }}
            />
          ) : (
            <Translate
              t={t}
              i18nKey="release.chip.tooltip.scheduled-for-date"
              values={{
                date: formatPublishDate(release),
              }}
            />
          )}
        </Text>
      )
    )
  }

  if (release.metadata.releaseType === 'undecided') {
    return <Text size={1}>{t('release.type.undecided')}</Text>
  }
  return null
}

const DATE_TIME_FORMAT: UseDateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
}

// eslint-disable-next-line complexity
export const DocumentPerspectiveList = memo(function DocumentPerspectiveList() {
  const {selectedPerspectiveName} = usePerspective()
  const {t} = useTranslation()
  const dateTimeFormat = useDateTimeFormat(DATE_TIME_FORMAT)
  const {loading} = useActiveReleases()
  const {editState, displayed} = useDocumentPane()
  const {documentType} = useDocumentPaneInfo()

  const {
    filteredReleases,
    getVersionDisplay,
    getReleaseChipState,
    handleCopyToDraftsNavigate,
    handlePerspectiveChange,
    handleVariantSelectionChange,
    isDraftDisabled,
    variantVersions,
    isDraftModelEnabled,
    isDraftSelected,
    isLiveEdit,
    isPublishedChipDisabled,
    isPublishSelected,
    nonReleaseVersions,
  } = useDocumentPerspectiveList()

  return (
    <>
      <VersionChip
        tooltipContent={
          <Text size={1}>
            {editState?.published && editState?.published?._updatedAt ? (
              <Translate
                t={t}
                i18nKey="release.chip.tooltip.published-date"
                values={{date: dateTimeFormat.format(new Date(editState?.published._updatedAt))}}
              />
            ) : (
              <>{t('release.chip.tooltip.not-published')}</>
            )}
          </Text>
        }
        disabled={isPublishedChipDisabled}
        onClick={() => handlePerspectiveChange('published')}
        selected={isPublishSelected}
        text={t('release.chip.published')}
        tone="positive"
        onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
        contextValues={{
          documentId: editState?.published?._id || editState?.id || '',
          releases: filteredReleases.notCurrentReleases,
          releasesLoading: loading,
          documentType,
          bundleId: 'published',
          isVersion: false,
          disabled: !editState?.published,
        }}
      />
      {isDraftModelEnabled && (
        <VersionChip
          tooltipContent={
            <Text size={1}>
              {editState?.draft ? (
                <>
                  {editState?.draft._updatedAt ? (
                    <Translate
                      t={t}
                      i18nKey="release.chip.tooltip.edited-date"
                      values={{date: dateTimeFormat.format(new Date(editState?.draft._updatedAt))}}
                    />
                  ) : (
                    <Translate
                      t={t}
                      i18nKey="release.chip.tooltip.created-date"
                      values={{date: dateTimeFormat.format(new Date(editState?.draft._createdAt))}}
                    />
                  )}
                </>
              ) : (
                <>
                  {isLiveEdit
                    ? t('release.chip.tooltip.draft-disabled.live-edit')
                    : t('release.chip.tooltip.no-edits')}
                </>
              )}
            </Text>
          }
          selected={isDraftSelected}
          disabled={isDraftDisabled}
          text={t('release.chip.draft')}
          tone={editState?.draft ? 'caution' : 'neutral'}
          onClick={() => handlePerspectiveChange('drafts')}
          onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
          contextValues={{
            documentId: editState?.draft?._id || editState?.published?._id || editState?.id || '',
            documentType: documentType,
            releases: filteredReleases.notCurrentReleases,
            releasesLoading: loading,
            bundleId: 'draft',
            isVersion: false,
          }}
        />
      )}
      {filteredReleases.inCreation && (
        <ReleaseTitle
          title={filteredReleases.inCreation.metadata.title}
          fallback={t('release.placeholder-untitled-release')}
          enableTooltip={false}
        >
          {({displayTitle, fullTitle, isTruncated}) => (
            <VersionChip
              tooltipContent={
                isTruncated ? (
                  <Stack space={2} style={{maxWidth: '300px'}}>
                    <Text size={1} weight="medium">
                      {fullTitle}
                    </Text>
                    <TooltipContent release={filteredReleases.inCreation!} />
                  </Stack>
                ) : (
                  <TooltipContent release={filteredReleases.inCreation!} />
                )
              }
              selected
              onClick={() => {}}
              locked={false}
              tone={getReleaseTone(filteredReleases.inCreation!)}
              text={displayTitle}
              onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
              contextValues={{
                documentId: displayed?._id || '',
                documentType,
                disabled: true,
                releases: filteredReleases.notCurrentReleases,
                releasesLoading: loading,
                bundleId: getReleaseIdFromReleaseDocumentId(filteredReleases.inCreation!._id),
                isVersion: true,
                release: filteredReleases.inCreation!,
              }}
            />
          )}
        </ReleaseTitle>
      )}

      {displayed &&
        filteredReleases.currentReleases?.map((release) => (
          <ReleaseTitle
            key={release._id}
            title={release.metadata.title}
            fallback={t('release.placeholder-untitled-release')}
            enableTooltip={false}
          >
            {({displayTitle, fullTitle, isTruncated}) => (
              <VersionChip
                tooltipContent={
                  isTruncated ? (
                    <Stack space={2} style={{maxWidth: '300px'}}>
                      <Text size={1} weight="medium">
                        {fullTitle}
                      </Text>
                      <TooltipContent release={release} />
                    </Stack>
                  ) : (
                    <TooltipContent release={release} />
                  )
                }
                {...getReleaseChipState(release)}
                onClick={() => handlePerspectiveChange(release)}
                text={displayTitle}
                tone={getReleaseTone(release)}
                locked={isReleaseScheduledOrScheduling(release)}
                onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
                contextValues={{
                  documentId: displayed?._id || '',
                  documentType,
                  releases: filteredReleases.notCurrentReleases,
                  releasesLoading: loading,
                  bundleId: getReleaseIdFromReleaseDocumentId(release._id),
                  isVersion: true,
                  release,
                  isGoingToUnpublish: editState?.version
                    ? isGoingToUnpublish(editState?.version as SanityDocumentLike)
                    : false,
                }}
              />
            )}
          </ReleaseTitle>
        ))}
      <NonReleaseVersionsSelect
        nonReleaseVersions={nonReleaseVersions}
        selectedPerspective={selectedPerspectiveName}
        onSelectBundle={(version) => {
          const bundleId = getVersionFromId(version._id)
          if (!bundleId) return
          handlePerspectiveChange(bundleId)
        }}
        onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
        releases={filteredReleases.notCurrentReleases}
        releasesLoading={loading}
        documentType={documentType}
        getVersionDisplay={getVersionDisplay}
        mode="versions"
      />
      <NonReleaseVersionsSelect
        nonReleaseVersions={variantVersions}
        selectedPerspective={selectedPerspectiveName}
        onSelectBundle={handleVariantSelectionChange}
        onCopyToDraftsNavigate={handleCopyToDraftsNavigate}
        releases={filteredReleases.notCurrentReleases}
        releasesLoading={loading}
        documentType={documentType}
        getVersionDisplay={getVersionDisplay}
        mode="variants"
      />
    </>
  )
})
