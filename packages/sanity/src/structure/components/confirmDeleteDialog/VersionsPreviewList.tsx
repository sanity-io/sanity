import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  getDocumentVariantType,
  getPreviewStateObservable,
  getPreviewValueWithFallback,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  getVersionFromId,
  ReleaseAvatarIcon,
  SanityDefaultPreview,
  type SchemaType,
  useActiveReleases,
  useDocumentPreviewStore,
  useSchema,
  useTranslation,
} from 'sanity'
import {styled} from 'styled-components'

const EllipsisText = styled(Text)`
  /* text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap; */
  max-width: 120px;
`

const VersionItemPreview = ({
  versionId,
  schemaType,
}: {
  versionId: string
  schemaType: SchemaType
}) => {
  const {t} = useTranslation()

  const documentPreviewStore = useDocumentPreviewStore()
  const documentVariant = getDocumentVariantType(versionId)
  const {data: releases} = useActiveReleases()
  const previewStateObservable = useMemo(() => {
    const perspectiveStack = [
      documentVariant === 'version'
        ? (getVersionFromId(versionId) as string)
        : documentVariant === 'published'
          ? 'published'
          : 'drafts',
    ]
    return getPreviewStateObservable(
      documentPreviewStore,
      schemaType,
      getPublishedId(versionId),
      perspectiveStack,
    )
  }, [documentPreviewStore, schemaType, versionId, documentVariant])

  const {
    snapshot,
    original,
    isLoading: previewIsLoading,
  } = useObservable(previewStateObservable, {
    snapshot: null,
    isLoading: true,
    original: null,
  })
  const release = useMemo(() => {
    if (documentVariant !== 'version') {
      return undefined
    }
    return releases.find(
      (r) => getReleaseIdFromReleaseDocumentId(r._id) === getVersionFromId(versionId),
    )
  }, [releases, versionId, documentVariant])

  const getVersionBadgeText = () => {
    if (documentVariant === 'version') {
      return release?.metadata?.title || (getVersionFromId(versionId) as string)
    }
    return documentVariant === 'published' ? t('release.chip.published') : t('release.chip.draft')
  }

  const tone = release
    ? getReleaseTone(release)
    : documentVariant === 'published'
      ? 'positive'
      : 'caution'

  return (
    <SanityDefaultPreview
      {...getPreviewValueWithFallback({
        snapshot,
        original,
        fallback: {
          _id: versionId,
          _type: schemaType.name,
        },
      })}
      isPlaceholder={previewIsLoading}
      icon={schemaType.icon}
      layout={'default'}
      status={
        <Card border radius="full">
          <Card radius={'full'} tone={tone} style={{backgroundColor: 'transparent'}}>
            <Flex align="center" gap={2} paddingY={2} paddingRight={3} paddingLeft={2}>
              <Text size={1}>
                <ReleaseAvatarIcon tone={tone} />
              </Text>
              <EllipsisText size={1} weight="medium" textOverflow="ellipsis">
                {getVersionBadgeText()}
              </EllipsisText>
            </Flex>
          </Card>
        </Card>
      }
    />
  )
}

/**
 * Given a document id and type, returns a list of the versions of the document with all the previews
 * Also indicates the version of the document in a badge next to the preview.
 *
 */
export const VersionsPreviewList = ({
  documentType,
  documentVersions,
}: {
  documentType: string
  documentVersions: string[]
}) => {
  const schema = useSchema()

  const schemaType = schema.get(documentType)
  if (!schemaType) {
    throw new Error(`Schema type ${documentType} not found`)
  }

  return (
    <Card border padding={1} radius={2}>
      <Stack>
        {documentVersions?.map((version) => (
          <VersionItemPreview key={version} versionId={version} schemaType={schemaType} />
        ))}
      </Stack>
    </Card>
  )
}
