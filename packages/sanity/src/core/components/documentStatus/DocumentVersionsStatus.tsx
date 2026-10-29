import {type ReleaseType} from '@sanity/client'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {useCompactTimeAgo} from '../../hooks/useRelativeTime'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {useWorkspace} from '../../studio/workspace'
import {readVersionType} from '../../util/versionsUtils'
import {useAllVariants} from '../../variants/store/useAllVariants'
import {getVariantTitle} from '../../variants/tool/util'
import {
  type DocumentVersionStatusGroup,
  type DocumentVersionStatusItem,
  groupDocumentVersionsForStatus,
  SHOW_AGENT_VERSIONS_IN_STATUS,
} from './sortDocumentVersionsForStatus'

/** Lines (the base document, then the audiences) the popover shows before its last line counts the rest. */
const MAX_LINES = 5
/** Glyphs a line shows before a "+N" stands for the others. */
const SHOWN_GLYPHS = 4
/** The popover's width: 400px as the v1 design draws it, up to 440px when a line needs it. */
const MIN_WIDTH = 400
const MAX_WIDTH = 440
/** Every line's padding, the last line's too: 8px top, right and bottom, 12px before the name (open beta design, Figma 751:161463). */
const LINE_PADDING = '8px 8px 8px 12px'
/** An audience line's height: Figma's 17px glyph box plus the 8px above and below; the glyphs here are trimmed to their cap height. */
const LINE_MIN_HEIGHT = 33

type VersionState = 'published' | 'draft' | 'scheduled' | 'asap' | 'undecided'

function stateOf(item: DocumentVersionStatusItem): VersionState {
  const type = readVersionType(item.version)
  if (type === 'published') return 'published'
  if (type === 'draft') return 'draft'
  const releaseType: ReleaseType | undefined = item.release?.metadata.releaseType
  return releaseType === 'scheduled' ? 'scheduled' : releaseType === 'asap' ? 'asap' : 'undecided'
}

const editedAt = (item: DocumentVersionStatusItem) => Date.parse(item.version._updatedAt ?? '') || 0

/** The newest edit on a line, for ordering the audiences. */
const newestEdit = (group: DocumentVersionStatusGroup) => Math.max(...group.items.map(editedAt))

/** A line's glyphs in a fixed order: published, draft, then the releases by date (as soon as possible, then by date, then undecided). */
const GLYPH_ORDER: Record<VersionState, number> = {
  published: 0,
  draft: 1,
  asap: 2,
  scheduled: 3,
  undecided: 4,
}
const releaseDate = (item: DocumentVersionStatusItem) =>
  Date.parse(item.release?.metadata.intendedPublishAt ?? '') || Number.MAX_SAFE_INTEGER
const byGlyphOrder = (left: DocumentVersionStatusItem, right: DocumentVersionStatusItem) =>
  GLYPH_ORDER[stateOf(left)] - GLYPH_ORDER[stateOf(right)] || releaseDate(left) - releaseDate(right)

/**
 * PROPOSED (the v1 versions popover, Variants open beta): what a document's status icons show on hover. One line per audience: the base
 * document first ("All users (Default)"), then the audiences by their most recent edit, newest first. Faheem, 22 Oct: each line is the
 * audience's name, ONE muted phrase for the line's most recent activity, "Published 1 day ago" or "Edited 3 days ago", then a glyph per
 * version at the right edge (published, draft, then its releases by date; four at most, then "+N"; open beta design, Figma 751:161463). Release names are not shown (the inventory has them).
 * After five lines a muted last line counts the versions not shown. Information only: nothing in it is clickable.
 *
 * @internal
 */
export function DocumentVersionsStatus({documentGroupId}: {documentGroupId: string}) {
  const {t} = useTranslation()
  const {byId: releasesById} = useActiveReleases()
  const {byId: variantsById} = useAllVariants()
  const {loading, versions} = useDocumentVersions({documentId: documentGroupId})
  const variantsEnabled = Boolean(useWorkspace().beta?.variants?.enabled)

  const lines = useMemo(() => {
    const groups = groupDocumentVersionsForStatus(versions, releasesById, variantsById, {
      variantsEnabled,
      showAgentVersions: SHOW_AGENT_VERSIONS_IN_STATUS,
    })
    const base = groups.filter((group) => !group.variantId)
    const audiences = groups
      .filter((group) => group.variantId)
      .toSorted((left, right) => newestEdit(right) - newestEdit(left))
    return [...base, ...audiences]
  }, [releasesById, variantsById, variantsEnabled, versions])

  if (loading) {
    return (
      <Box padding={2}>
        <Text muted size={1}>
          {t('common.loading')}
        </Text>
      </Box>
    )
  }

  const shown = lines.slice(0, MAX_LINES)
  const more = lines.slice(MAX_LINES).reduce((count, group) => count + group.items.length, 0)
  const audienceTitle = (variantId: string | undefined) => {
    if (!variantId) return t('document-group.base-variant')
    const variant = variantsById.get(variantId)
    return variant ? getVariantTitle(variant) : variantId
  }

  return (
    // The tooltip's own card is the popover's shell: the lines run edge to edge inside it (the margin takes back its 8px padding), 400px
    // wide as in the v1 design, up to 440px when a line needs it (the tooltip's boundary is the page, see PreviewTooltip).
    <Stack
      data-testid="document-versions-status"
      style={{margin: -8, maxWidth: MAX_WIDTH, minWidth: MIN_WIDTH, width: 'max-content'}}
    >
      {shown.map((group, index) => {
        const items = group.items.toSorted(byGlyphOrder)
        const hidden = items.length - SHOWN_GLYPHS
        const latest = group.items.reduce((newest, item) =>
          editedAt(item) > editedAt(newest) ? item : newest,
        )
        return (
          <Flex
            align="center"
            data-testid="audience-line"
            gap={2}
            key={group.variantId ?? 'default'}
            style={{
              boxShadow: index ? 'inset 0 1px 0 var(--card-hairline-soft-color)' : undefined,
              padding: LINE_PADDING,
              minHeight: LINE_MIN_HEIGHT,
            }}
          >
            {/* The audience's name takes the room left; it ends in an ellipsis before anything else gives way (down to 96px). */}
            <Box style={{flex: '1 1 auto', minWidth: 96}}>
              {variantsEnabled || group.variantId ? (
                <Text size={1} textOverflow="ellipsis">
                  {audienceTitle(group.variantId)}
                </Text>
              ) : null}
            </Box>
            <LatestActivity item={latest} />
            {/* The glyphs close the line, at its right edge. */}
            <Flex align="center" data-testid="audience-line-glyphs" flex="none">
              {items.slice(0, SHOWN_GLYPHS).map((item) => (
                <Glyph item={item} key={item.version._id} />
              ))}
              {hidden > 0 ? (
                <Text data-testid="state-more" muted size={1}>{`+${hidden}`}</Text>
              ) : null}
            </Flex>
          </Flex>
        )
      })}
      {more > 0 ? (
        <Card borderTop data-testid="document-versions-status-more" style={{padding: LINE_PADDING}}>
          <Text muted size={1}>
            {t('document-group.status.more', {count: more})}
          </Text>
        </Card>
      ) : null}
    </Stack>
  )
}

/** A version as its glyph, in its tone, at the list's small size: the published dot, the draft ring, the release's bolt, clock or dot. */
function Glyph({item}: {item: DocumentVersionStatusItem}) {
  const state = stateOf(item)
  return (
    <Text data-state={state} data-testid={`state-${state}`} size={1}>
      {state === 'published' ? (
        <ReleaseAvatarIcon release={PUBLISHED} size="small" />
      ) : state === 'draft' ? (
        <ReleaseAvatarIcon release={LATEST} size="small" />
      ) : (
        <ReleaseAvatarIcon releaseType={state} size="small" />
      )}
    </Text>
  )
}

/** The line's most recent activity as one muted phrase: "Published 1 day ago" if it is the published version, else "Edited 3 days ago". */
function LatestActivity({item}: {item: DocumentVersionStatusItem}) {
  const {t} = useTranslation()
  const ago = useCompactTimeAgo(item.version._updatedAt ?? '')
  if (!ago) return null
  const phrase =
    stateOf(item) === 'published'
      ? t('document-group.status.published-when', {when: ago})
      : t('document-group.status.edited-when', {when: ago})
  return (
    <Box data-testid="audience-line-activity" flex="none">
      <Text muted size={1} style={{whiteSpace: 'nowrap'}}>
        {phrase}
      </Text>
    </Box>
  )
}
