import {type ReleaseId} from '@sanity/client'
import {Flex, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {
  getReleaseTone,
  getVersionFromId,
  isDraftId,
  isPublishedId,
  useActiveReleases,
  useDocumentVersions,
  useDocumentVersionSortedList,
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
  const {onlyHasVersions} = useDocumentVersionSortedList({documentId})

  /** this banner should only be rendered in specific cases
   * 1. when the document is not a draft or published
   * 2. when the document only has version or versions
   * 3. when the global perspective is not set (published or draft)
   */

  if (isDraftId(documentId) || isPublishedId(documentId)) {
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
  const {data: documentVersions} = useDocumentVersions({documentId})

  const documentVersionsTitleList = useMemo(
    () =>
      activeReleases
        .filter((version) => {
          return documentVersions.find((release) => {
            const r = getVersionFromId(release) ?? ''
            return version._id.includes(r)
          })
        })
        .map((version) => version.metadata.title),
    [activeReleases, documentVersions],
  )
  const tone = currentVersion && getReleaseTone(currentVersion)
  const {t} = useTranslation(structureLocaleNamespace)

  const handleGoToEdit = useCallback(async () => {
    setPerspective(releaseId as ReleaseId)
  }, [releaseId, setPerspective])

  return (
    <Banner
      tone={tone}
      paddingY={0}
      data-testId="open-release-to-edit-banner"
      content={
        <Flex direction={'row'} align="center" justify="space-between" flex={1}>
          <Text size={1}>
            <Flex direction={'row'} gap={1}>
              {t('banners.release.navigate-to-edit-description')}
              {documentVersionsTitleList.map((title) => (
                <VersionInlineBadge key={`${title}${documentId}`}>{title}</VersionInlineBadge>
              ))}
              {t('banners.release.navigate-to-edit-description-end', {
                count: documentVersionsTitleList.length,
              })}
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
