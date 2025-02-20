import {Flex, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionInlineBadge,
  LATEST,
  type ReleaseDocument,
  Translate,
  useTranslation,
  useVersionOperations,
} from 'sanity'
import {structureLocaleNamespace} from 'sanity/structure'

import {Button} from '../../../../../ui-components'
import {Banner} from './Banner'

export function AddToReleaseBanner({
  documentId,
  currentRelease,
  value,
}: {
  documentId: string
  currentRelease: ReleaseDocument
  value?: Record<string, unknown>
}): React.JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tCore} = useTranslation()

  const {createVersion} = useVersionOperations()

  const handleAddToRelease = useCallback(async () => {
    if (currentRelease._id) {
      await createVersion(getReleaseIdFromReleaseDocumentId(currentRelease._id), documentId, value)
    }
  }, [createVersion, currentRelease._id, documentId, value])

  return (
    <Banner
      tone={tone}
      paddingY={0}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1}>
            <Translate
              i18nKey="banners.release.not-in-release"
              t={t}
              values={{
                title:
                  currentRelease?.metadata?.title || tCore('release.placeholder-untitled-release'),
              }}
              components={{
                VersionBadge: getVersionInlineBadge(currentRelease),
              }}
            />
          </Text>

          <Button
            text={t('banners.release.action.add-to-release')}
            tone={tone}
            onClick={handleAddToRelease}
          />
        </Flex>
      }
    />
  )
}
