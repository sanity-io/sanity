import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {Box} from 'ui5'

import {useDocumentVersionTitle} from '../../hooks/useDocumentVersionTitle'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {useWorkspace} from '../../studio/workspace'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {getVariantTitle} from '../../variants/tool/util'
import {DocumentVersionIcons} from './DocumentVersionIcons'
import {titleStack, versionStatusItem} from './DocumentVersionsStatus.css'
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

  const groupTitle = (variantId: string | undefined) => {
    if (!variantId) return t('document-group.base-variant')
    const variant = variantsById.get(variantId)
    return variant ? getVariantTitle(variant) : variantId
  }

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
          {/* PROPOSED: with variants, each group is headed by its variant ("All users (Default)", "Students") and its rows name only the
              state (Published, Draft, a release). Information only: nothing in it is clickable, and it shows no dates. */}
          {variantsEnabled && (
            <Box paddingBottom={1} paddingTop={2}>
              {/* Plain muted text, not an uppercase Label: variant names keep their casing (de-DE). */}
              <Text muted size={1}>
                {groupTitle(group.variantId)}
              </Text>
            </Box>
          )}
          {group.items.map((item) => (
            <VersionStatus key={item.version._id} {...item} stateOnly={variantsEnabled} />
          ))}
        </Card>
      ))}
    </Stack>
  )
}

function VersionStatus({version, stateOnly}: DocumentVersionStatusItem & {stateOnly: boolean}) {
  const {title, isTruncated, fullTitle, stateTitle, stateFullTitle} = useDocumentVersionTitle({
    version,
  })
  const shown = stateOnly ? stateTitle : title
  const full = stateOnly ? stateFullTitle : fullTitle

  return (
    <Box className={versionStatusItem}>
      <Flex align="center" gap={2} justify="space-between" paddingY={2}>
        <Stack className={titleStack}>
          <Text size={1} title={isTruncated ? full : undefined} weight="medium">
            {shown}
          </Text>
        </Stack>
        <Box paddingRight={2}>
          <DocumentVersionIcons version={version} />
        </Box>
      </Flex>
    </Box>
  )
}
