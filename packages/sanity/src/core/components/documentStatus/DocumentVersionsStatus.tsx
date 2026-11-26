import {Card} from '@sanity/ui'
import {useMemo} from 'react'
import {Text, Flex, Box, VStack} from 'ui5'

import {useDocumentVersionTitle} from '../../hooks/useDocumentVersionTitle'
import {useRelativeTime} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useWorkspace} from '../../studio/workspace'
import {type SystemVariant} from '../../variants/types'
import {DocumentVersionIcons} from './DocumentVersionIcons'
import {titleStack, updatedAtText, versionStatusItem} from './DocumentVersionsStatus.css'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {GroupedDocumentVersionsStatus} from './GroupedDocumentVersionsStatus'
import {
  type DocumentVersionStatusItem,
  groupDocumentVersionsForStatus,
  SHOW_AGENT_VERSIONS_IN_STATUS,
} from './sortDocumentVersionsForStatus'

const NO_VARIANTS = new Map<string, SystemVariant>()

/**
 * Displays document status for all of the versions of a given document.
 *
 * With variants enabled it shows `GroupedDocumentVersionsStatus` instead, which groups the
 * versions by variant definition.
 *
 * @internal
 */
export function DocumentVersionsStatus({documentGroupId}: {documentGroupId: string}) {
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)

  if (variantsEnabled) {
    return <GroupedDocumentVersionsStatus documentGroupId={documentGroupId} />
  }

  return <VersionStatusList documentGroupId={documentGroupId} />
}

function VersionStatusList({documentGroupId}: {documentGroupId: string}) {
  const {t} = useTranslation()
  const {byId: releasesById} = useActiveReleases()
  const {loading, versions} = useDocumentVersions({documentId: documentGroupId})

  const versionGroups = useMemo(
    () =>
      groupDocumentVersionsForStatus(versions, releasesById, NO_VARIANTS, {
        variantsEnabled: false,
        showAgentVersions: SHOW_AGENT_VERSIONS_IN_STATUS,
      }),
    [releasesById, versions],
  )

  if (loading) {
    return (
      <Box padding={2}>
        <Text muted size={1} as="div" trim={true}>
          {t('common.loading')}
        </Text>
      </Box>
    )
  }

  return (
    <VStack gap={1}>
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
    <Box className={versionStatusItem}>
      <Flex gap={2} justifyContent="space-between" paddingY={2}>
        <VStack className={titleStack} gap={2}>
          <Text
            size={1}
            title={isTruncated ? fullTitle : undefined}
            weight="medium"
            as="div"
            trim={true}
          >
            {title}
          </Text>
          <Text className={updatedAtText} muted size={1} as="div" trim={true}>
            {timestampLabel}
          </Text>
        </VStack>
        <Box paddingRight={2}>
          <DocumentVersionIcons version={version} />
        </Box>
      </Flex>
    </Box>
  )
}
