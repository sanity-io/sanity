import {Flex, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  isVersionId,
  Translate,
  useActiveReleases,
  useDocumentVersions,
  useOnlyHasVersions,
  useSetPerspective,
  useTranslation,
  VersionInlineBadge,
} from 'sanity'
import {structureLocaleNamespace} from 'sanity/structure'

import {Button} from '../../../../../ui-components'
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

export function OpenReleaseToEditBannerInner({
  documentId,
}: {
  documentId: string
}): React.JSX.Element {
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
          return documentVersions.find((release) => {
            const r = getVersionFromId(release) ?? ''
            return getReleaseIdFromReleaseDocumentId(version._id) === r
          })
        })
        .map((version) => version.metadata.title || tCore('release.placeholder-untitled-release')),
    [activeReleases, documentVersions, tCore],
  )
  const tone = currentVersion && getReleaseTone(currentVersion)
  const {t} = useTranslation(structureLocaleNamespace)

  const handleGoToEdit = useCallback(async () => {
    setPerspective(releaseId)
  }, [releaseId, setPerspective])

  return (
    <Banner
      tone={tone}
      paddingY={0}
      data-testid="open-release-to-edit-banner"
      content={
        <Flex direction={'row'} align="center" justify="space-between" flex={1}>
          <Text size={1}>
            <Flex direction={'row'} gap={1}>
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

          <Button
            text={t('banners.release.action.open-to-edit')}
            tone={tone}
            onClick={handleGoToEdit}
          />
        </Flex>
      }
    />
  )
}
