import {type ReleaseDocument} from '@sanity/client'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {RhombusIcon} from '../../components/temporary-icons/Rhombus'
import {useRelativeTime} from '../../hooks/useRelativeTime'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type TargetPerspective} from '../../perspective/types'
import {ReleaseAvatar} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {variantIconCard, versionStatusTitles} from './DocumentVersionsStatus.css'
import {
  type DocumentVersionStatusItem,
  groupDocumentVersionsForStatus,
} from './sortDocumentVersionsForStatus'
/**
 * Displays document status for all of the versions of a given document.
 *
 *
 * @internal
 */
export function DocumentVersionsStatus({documentGroupId}: {documentGroupId: string}) {
  const {data: releases} = useActiveReleases()
  const {byId: variantsById} = useAllVariants()
  const {versions} = useDocumentVersions({documentId: documentGroupId})

  const versionGroups = useMemo(
    () => groupDocumentVersionsForStatus(versions, releases ?? [], variantsById),
    [releases, variantsById, versions],
  )

  return (
    <Stack gap={1}>
      {versionGroups.map((group, groupIndex, allGroups) => (
        <Card
          borderBottom={groupIndex < allGroups.length - 1}
          key={group.variantId ?? 'default'}
          paddingBottom={groupIndex < allGroups.length - 1 ? 1 : 0}
        >
          {group.items.map((item) => (
            <VersionStatus key={item.version._id} {...item} />
          ))}
        </Card>
      ))}
    </Stack>
  )
}

function VersionStatus({release, version, variant}: DocumentVersionStatusItem) {
  const {t} = useTranslation()

  const variantTitle = variant
    ? variant.metadata?.title || variant.name
    : t('document-group.base-variant')

  const releaseTitle = getReleaseTitle({release, t, version})
  const releasePerspective = getReleasePerspective({release, version})

  const updatedAt = useRelativeTime(version._updatedAt, {
    minimal: true,
    useTemporalPhrase: true,
  })

  return (
    <Box paddingX={0}>
      <Flex align="center" gap={2} padding={2} style={{minWidth: 0, width: '100%'}}>
        <Box className={versionStatusTitles} paddingY={1}>
          <Text size={1} textOverflow="ellipsis">
            {variantTitle} · {releaseTitle}
          </Text>
        </Box>
        <Text muted size={1} style={{flex: 'none', whiteSpace: 'nowrap'}}>
          · {updatedAt}
        </Text>
        <Box flex={1} />
        <Flex align="center" flex="none" gap={2}>
          {variant ? (
            <Card className={variantIconCard} tone="suggest">
              <Text size={2}>
                <RhombusIcon />
              </Text>
            </Card>
          ) : null}
          <ReleaseAvatar fontSize={2} size="small" release={releasePerspective} padding={0} />
        </Flex>
      </Flex>
    </Box>
  )
}

function getReleaseTitle({
  release,
  t,
  version,
}: {
  release?: ReleaseDocument
  t: ReturnType<typeof useTranslation>['t']
  version: VersionInfoDocumentStub
}): string {
  if (version._system.release?._ref) {
    return release?.metadata.title || release?.name || t('release.placeholder-untitled-release')
  }

  if (version._system.bundleId === 'drafts') {
    return t('release.chip.draft')
  }

  if (version._createdAt === version._updatedAt) {
    return t('timeline.operation.created')
  }

  return t('release.chip.published')
}

function getReleasePerspective({
  release,
  version,
}: {
  release?: ReleaseDocument
  version: VersionInfoDocumentStub
}): TargetPerspective {
  if (release) {
    return release
  }

  if (version._system.bundleId === 'drafts') {
    return LATEST
  }

  return PUBLISHED
}
