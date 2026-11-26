import {Box, Flex, Text} from 'ui5'

import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useSchema} from '../../hooks/useSchema'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {readVersionType} from '../../util/versionsUtils'
import {DocumentStatusIcon} from '../documentStatusIndicator/DocumentVersionsStatusIndicator'
import {getAudienceName} from './getAudienceName'
import {getGroupedDocumentVersionStatusTimestampKey} from './getDocumentVersionStatusTimestampKey'
import {lineIcons, lineName, root} from './GroupedDocumentVersionsStatus.css'
import {type DocumentVersionStatusGroup} from './sortDocumentVersionsForStatus'
import {latestEdit, useDocumentVersionStatusGroups} from './useDocumentVersionStatusGroups'

const MAX_LINES = 7

/** The order of the document list's status icons, which keeps published at the right edge. */
const ICON_KINDS = ['release', 'draft', 'published'] as const

/**
 * Displays the versions of a document grouped by variant definition: one line per audience, the
 * default one first, then the others by their latest edit. Each line shows the audience, when it
 * was last published or edited, and one status icon per kind of version it has.
 *
 * `DocumentVersionsStatus` renders it in place of its own list when variants are enabled.
 *
 * @internal
 */
export function GroupedDocumentVersionsStatus({documentGroupId}: {documentGroupId: string}) {
  const {t} = useTranslation()
  const {groups, loading} = useDocumentVersionStatusGroups(documentGroupId, {
    variantsEnabled: true,
  })

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
  const latest = latestEdit(group)
  const {version} = latest
  const liveEdit = Boolean(schema.get(version._type)?.liveEdit)
  const timeAgo = useCompactTimeAgo(version._updatedAt)
  const name = getAudienceName({group, latest, t, variantsEnabled: true})

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
          {t(getGroupedDocumentVersionStatusTimestampKey(version, liveEdit), {date: timeAgo})}
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
