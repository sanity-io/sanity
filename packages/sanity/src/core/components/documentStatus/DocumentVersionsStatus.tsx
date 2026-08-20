import {type ReleaseDocument} from '@sanity/client'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {RhombusIcon} from '../../components/temporary-icons/Rhombus'
import {useRelativeTime} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {type TargetPerspective} from '../../perspective/types'
import {ReleaseAvatar} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {getVersionFilterLabel} from '../../variants/plugin/components/getVersionFilterLabel'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {
  titleStack,
  updatedAtText,
  variantIconCard,
  versionStatusItem,
} from './DocumentVersionsStatus.css'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
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
  const {t} = useTranslation()
  const {data: releases} = useActiveReleases()
  const {byId: variantsById} = useAllVariants()
  const {loading, versions} = useDocumentVersions({documentId: documentGroupId})

  const versionGroups = useMemo(
    () => groupDocumentVersionsForStatus(versions, releases ?? [], variantsById),
    [releases, variantsById, versions],
  )

  if (loading) {
    return (
      <Box padding={2}>
        <Text muted size={1}>
          {t('common.loading')}
        </Text>
      </Box>
    )
  }

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
  const schema = useSchema()
  const {bundles} = useAgentBundles()
  const liveEdit = Boolean(version._type && schema.get(version._type)?.liveEdit)

  const variantTitle = variant
    ? variant.metadata?.title || variant.name
    : t('document-group.base-variant')

  const releasePerspective = getReleasePerspective({release, version})
  const {
    displayTitle: releaseTitle,
    fullTitle,
    isTruncated,
  } = getVersionFilterLabel(releasePerspective, t, bundles)

  const updatedAt = useRelativeTime(version._updatedAt, {
    minimal: true,
    useTemporalPhrase: true,
  })
  const timestampLabel = t(getDocumentVersionStatusTimestampKey(version, liveEdit), {
    date: updatedAt,
  })

  return (
    <Box className={versionStatusItem}>
      <Flex paddingX={0} gap={2} padding={2}>
        <Stack className={titleStack} gap={2}>
          <Box>
            <Text size={1} title={isTruncated ? fullTitle : undefined} weight="medium">
              {variantTitle} · {releaseTitle}
            </Text>
          </Box>
          <Box>
            <Text className={updatedAtText} muted size={1}>
              {timestampLabel}
            </Text>
          </Box>
        </Stack>
        <Box flex={1} />
        <Flex align="center" flex="none" gap={1} paddingRight={2}>
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

  if (version._system.bundleId) {
    return version._system.bundleId
  }

  return PUBLISHED
}
