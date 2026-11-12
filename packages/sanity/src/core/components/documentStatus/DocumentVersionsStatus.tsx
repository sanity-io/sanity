import {useMemo} from 'react'
import {Box, Flex, Text} from 'ui5'

import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useWorkspace} from '../../studio/workspace'
import {readVersionType} from '../../util/versionsUtils'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {getVariantId, getVariantTitle} from '../../variants/tool/util'
import {DocumentStatusIcon} from '../documentStatusIndicator/DocumentVersionsStatusIndicator'
import {lineIcons, lineName, root} from './DocumentVersionsStatus.css'
import {getDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {
  type DocumentVersionStatusGroup,
  type DocumentVersionStatusItem,
  groupDocumentVersionsForStatus,
  SHOW_AGENT_VERSIONS_IN_STATUS,
} from './sortDocumentVersionsForStatus'

const MAX_LINES = 7

/** The order of the document list's status icons, which keeps published at the right edge. */
const ICON_KINDS = ['release', 'draft', 'published'] as const

/** @internal */
const editedAt = (item: DocumentVersionStatusItem) => Date.parse(item.version._updatedAt) || 0

/** @internal */
export function latestEdit(group: DocumentVersionStatusGroup): DocumentVersionStatusItem {
  return group.items.reduce((latest, item) => (editedAt(item) > editedAt(latest) ? item : latest))
}

/**
 * The audience lines of a document's versions: the default one first, then the others by their
 * latest edit.
 *
 * @internal
 */
export function useDocumentVersionStatusGroups(documentGroupId: string): {
  groups: DocumentVersionStatusGroup[]
  loading: boolean
} {
  const {byId: releasesById} = useActiveReleases()
  const {byId: variantsById, loading: variantsLoading} = useAllVariants()
  const {loading, versions} = useDocumentVersions({documentId: documentGroupId})
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)

  const groups = useMemo(() => {
    const allGroups = groupDocumentVersionsForStatus(versions, releasesById, variantsById, {
      variantsEnabled,
      showAgentVersions: SHOW_AGENT_VERSIONS_IN_STATUS,
    })
    const audiences = allGroups
      .filter((group) => group.variantId)
      .toSorted((left, right) => editedAt(latestEdit(right)) - editedAt(latestEdit(left)))
    return [...allGroups.filter((group) => !group.variantId), ...audiences]
  }, [releasesById, variantsById, variantsEnabled, versions])

  return {groups, loading: loading || variantsLoading}
}

/**
 * Displays the versions of a document: one line per audience, the default one first, then the
 * others by their latest edit. Each line shows the audience, when it was last published or edited,
 * and one status icon per kind of version it has.
 *
 * @internal
 */
export function DocumentVersionsStatus({documentGroupId}: {documentGroupId: string}) {
  const {t} = useTranslation()
  const {groups, loading} = useDocumentVersionStatusGroups(documentGroupId)

  if (loading) {
    return (
      <Box padding={2}>
        <Text muted size={1} as="div" trim={true}>
          {t('common.loading')}
        </Text>
      </Box>
    )
  }

  const hiddenVersionCount = groups
    .slice(MAX_LINES)
    .reduce((count, group) => count + group.items.length, 0)

  return (
    <div className={root} data-testid="document-versions-status">
      {groups.slice(0, MAX_LINES).map((group, index) => (
        <AudienceLine group={group} key={group.variantId ?? 'default'} index={index} />
      ))}
      {hiddenVersionCount > 0 && (
        <Flex
          alignItems="center"
          data-testid="document-versions-status-more"
          paddingY={2}
          paddingLeft={3}
          paddingRight={2}
          borderTop
        >
          <Box paddingY={1}>
            <Text muted size={1} trim>
              {t('document-group.status.more', {count: hiddenVersionCount})}
            </Text>
          </Box>
        </Flex>
      )}
    </div>
  )
}

function AudienceLine({group, index}: {group: DocumentVersionStatusGroup; index: number}) {
  const {t} = useTranslation()
  const schema = useSchema()
  const {version} = latestEdit(group)
  const liveEdit = Boolean(schema.get(version._type)?.liveEdit)
  const timeAgo = useCompactTimeAgo(version._updatedAt)
  const variant = group.items[0]?.variant
  let name = t('document-group.base-variant')
  if (group.variantId) {
    name = variant ? getVariantTitle(variant) : getVariantId(group.variantId)
  }

  return (
    <Flex
      alignItems="center"
      data-testid="document-versions-status-line"
      gap={2}
      paddingY={1}
      paddingLeft={3}
      paddingRight={2}
      borderTop={index > 0}
    >
      <Box className={lineName}>
        <Text size={1} truncate={1}>
          {name}
        </Text>
      </Box>
      <Box flexShrink={0}>
        <Text muted size={1}>
          {t(getDocumentVersionStatusTimestampKey(version, liveEdit), {date: timeAgo})}
        </Text>
      </Box>
      <div className={lineIcons}>
        {ICON_KINDS.map((kind) => {
          const item = group.items.find((candidate) => readVersionType(candidate.version) === kind)
          return item ? <DocumentStatusIcon key={kind} kind={kind} release={item.release} /> : null
        })}
      </div>
    </Flex>
  )
}
