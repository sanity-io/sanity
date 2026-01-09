import {Flex, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  isCardinalityOneRelease,
  isVersionId,
  Translate,
  useActiveReleases,
  useDocumentVersions,
  useOnlyHasVersions,
  useSetPerspective,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'

import {structureLocaleNamespace} from '../../../../i18n'
import {Banner} from './Banner'

export function OpenReleaseToEditBanner({
  documentId,
  isPinnedDraftOrPublished,
}: {
  documentId: string
  isPinnedDraftOrPublished: boolean
}): React.JSX.Element | null {
  const onlyHasVersions = useOnlyHasVersions({documentId})

  /** this banner should only be rendered in specific cases
   * 1. when the document is not a draft or published
   * 2. when the document only has version or versions
   * 3. when the global perspective is not set (published or draft)
   */

  if (!isVersionId(documentId)) {
    return null
  }

  if (!onlyHasVersions || !isPinnedDraftOrPublished) {
    return null
  }

  return <OpenReleaseToEditBannerInner documentId={documentId} />
}

export function OpenReleaseToEditBannerInner({documentId}: {documentId: string}) {
  const {data: activeReleases} = useActiveReleases()
  const setPerspective = useSetPerspective()
  const releaseId = getVersionFromId(documentId) ?? ''
  const currentVersion = useMemo(
    () => activeReleases.find((version) => version._id.includes(releaseId)),
    [activeReleases, releaseId],
  )
  const {t: tCore} = useTranslation()

  const {data: documentVersions} = useDocumentVersions({documentId})

  const documentVersionsTitleList = useMemo(
    () =>
      activeReleases
        .filter((version) => {
          const hasDocumentVersion = documentVersions.find((release) => {
            const r = getVersionFromId(release) ?? ''
            return getReleaseIdFromReleaseDocumentId(version._id) === r
          })
          return hasDocumentVersion && !isCardinalityOneRelease(version)
        })
        .map((version) => version.metadata.title || tCore('release.placeholder-untitled-release')),
    [activeReleases, documentVersions, tCore],
  )
  const tone = currentVersion && getReleaseTone(currentVersion)
  const {t} = useTranslation(structureLocaleNamespace)

  const handleGoToEdit = useCallback(async () => {
    setPerspective(releaseId)
  }, [releaseId, setPerspective])

  if (documentVersionsTitleList.length === 0) {
    return null
  }

  return (
    <Banner
      tone={tone}
      data-testid="open-release-to-edit-banner"
      content={
        <Text size={1}>
          <Flex direction={'row'} gap={1} wrap="wrap">
            {documentVersionsTitleList.length > 1 ? (
              <Translate
                t={t}
                i18nKey="banners.release.navigate-to-edit-description-multiple"
                components={{
                  VersionBadge: () => (
                    <VersionInlineBadge> {documentVersionsTitleList[0]}</VersionInlineBadge>
                  ),
                }}
                values={{count: documentVersionsTitleList.length - 1}}
              />
            ) : (
              <Translate
                t={t}
                i18nKey="banners.release.navigate-to-edit-description-single"
                components={{
                  VersionBadge: () => (
                    <VersionInlineBadge> {documentVersionsTitleList[0]}</VersionInlineBadge>
                  ),
                }}
              />
            )}
          </Flex>
        </Text>
      }
      action={
        documentVersionsTitleList.length > 0
          ? {
              text: t('banners.release.action.open-to-edit'),
              tone: tone,
              onClick: handleGoToEdit,
              mode: 'default',
            }
          : undefined
      }
    />
  )
}
