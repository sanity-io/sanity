import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {Box} from 'ui5'

import {useDocumentVersionTitle} from '../../hooks/useDocumentVersionTitle'
import {useRelativeTime} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useWorkspace} from '../../studio/workspace'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {DocumentVersionIcons} from './DocumentVersionIcons'
import {titleStack, updatedAtText, versionStatusItem} from './DocumentVersionsStatus.css'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {
  type DocumentVersionStatusItem,
  groupDocumentVersionsForStatus,
  SHOW_AGENT_VERSIONS_IN_STATUS,
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
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)

  const versionGroups = useMemo(
    () =>
      groupDocumentVersionsForStatus(versions, releases ?? [], variantsById, {
        variantsEnabled,
        showAgentVersions: SHOW_AGENT_VERSIONS_IN_STATUS,
      }),
    [releases, variantsById, variantsEnabled, versions],
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
            <VersionStatus key={item.version._id} variantsEnabled={variantsEnabled} {...item} />
          ))}
        </Card>
      ))}
    </Stack>
  )
}

function VersionStatus({version}: DocumentVersionStatusItem & {variantsEnabled: boolean}) {
  const {t} = useTranslation()
  const schema = useSchema()
  const liveEdit = Boolean(version._type && schema.get(version._type)?.liveEdit)

  const {title, isTruncated, fullTitle} = useDocumentVersionTitle({version})

  const updatedAt = useRelativeTime(version._updatedAt, {
    minimal: true,
    useTemporalPhrase: true,
  })
  const timestampLabel = t(getDocumentVersionStatusTimestampKey(version, liveEdit), {
    date: updatedAt,
  })

  return (
    <Box className={versionStatusItem}>
      <Flex gap={2} justify="space-between" paddingY={2}>
        <Stack className={titleStack} gap={2}>
          <Text size={1} title={isTruncated ? fullTitle : undefined} weight="medium">
            {title}
          </Text>
          <Text className={updatedAtText} muted size={1}>
            {timestampLabel}
          </Text>
        </Stack>
        <Box paddingRight={2}>
          <DocumentVersionIcons version={version} />
        </Box>
      </Flex>
    </Box>
  )
}
