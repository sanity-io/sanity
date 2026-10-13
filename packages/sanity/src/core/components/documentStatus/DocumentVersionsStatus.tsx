import {Card, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {Flex, VStack} from 'ui5'

import {useDocumentVersionTitle} from '../../hooks/useDocumentVersionTitle'
import {useRelativeTime} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useWorkspace} from '../../studio/workspace'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {DocumentVersionIcons} from './DocumentVersionIcons'
import {titleStack, updatedAtText} from './DocumentVersionsStatus.css'
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
  const {byId: releasesById} = useActiveReleases()
  const {byId: variantsById} = useAllVariants()
  const {loading, versions} = useDocumentVersions({documentId: documentGroupId})
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)

  const versionGroups = useMemo(
    () =>
      groupDocumentVersionsForStatus(versions, releasesById, variantsById, {
        variantsEnabled,
        showAgentVersions: SHOW_AGENT_VERSIONS_IN_STATUS,
      }),
    [releasesById, variantsById, variantsEnabled, versions],
  )

  if (loading) {
    return (
      <Text muted size={1}>
        {t('common.loading')}
      </Text>
    )
  }

  // Rows and groups sit two space steps apart, twice the step the tooltip card pads itself by,
  // so they read as separate entries against the one step inside a row.
  return (
    <VStack gap={2}>
      {versionGroups.map((group, groupIndex, allGroups) => (
        <Card
          borderBottom={groupIndex < allGroups.length - 1}
          key={group.variantId ?? 'default'}
          paddingBottom={groupIndex < allGroups.length - 1 ? 1 : 0}
        >
          <VStack gap={2}>
            {group.items.map((item) => (
              <VersionStatus key={item.version._id} {...item} />
            ))}
          </VStack>
        </Card>
      ))}
    </VStack>
  )
}

function VersionStatus({version}: DocumentVersionStatusItem) {
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
    // `flex-start` keeps the avatars on the title line: `DocumentVersionIcons` centers its own
    // content, so a stretched row would drop them between the title and the timestamp.
    <Flex alignItems="flex-start" gap={2} justifyContent="space-between">
      <VStack className={titleStack} gap={1}>
        <Text size={1} title={isTruncated ? fullTitle : undefined} weight="medium">
          {title}
        </Text>
        <Text className={updatedAtText} muted size={1}>
          {timestampLabel}
        </Text>
      </VStack>
      <DocumentVersionIcons version={version} />
    </Flex>
  )
}
