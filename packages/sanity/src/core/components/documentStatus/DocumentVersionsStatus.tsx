import {type ReleaseType} from '@sanity/client'
import {type BadgeTone, Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {useCompactRelativeTime} from '../../hooks/useRelativeTime'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {useDocumentVersions} from '../../releases/hooks/useDocumentVersions'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED, RELEASE_TYPES_TONES} from '../../releases/util/const'
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
/** States a line shows before a "+N" stands for the others. */
const SHOWN_STATES = 2
/** The popover's width, as the v1 design draws it. */
const WIDTH = 400
/** A state label's widest: a long release name ends in an ellipsis, so the audience's name keeps its room. */
const LABEL_MAX = 132

type VersionState = 'published' | 'draft' | 'scheduled' | 'asap' | 'undecided'

const STATE_TONE: Record<VersionState, BadgeTone> = {
  published: 'positive',
  draft: 'caution',
  scheduled: RELEASE_TYPES_TONES.scheduled.tone,
  asap: 'caution',
  undecided: 'default',
}

function stateOf(item: DocumentVersionStatusItem): VersionState {
  const type = readVersionType(item.version)
  if (type === 'published') return 'published'
  if (type === 'draft') return 'draft'
  const releaseType: ReleaseType | undefined = item.release?.metadata.releaseType
  return releaseType === 'scheduled' ? 'scheduled' : releaseType === 'asap' ? 'asap' : 'undecided'
}

/** The newest edit on a line, for ordering the audiences and for the line's time. */
const newestEdit = (group: DocumentVersionStatusGroup) =>
  Math.max(...group.items.map((item) => Date.parse(item.version._updatedAt ?? '') || 0))

/**
 * PROPOSED (the v1 versions popover, Variants open beta): what a document's status icons show on hover. One line per audience: the base
 * document first ("All users (Default)"), then the audiences by their most recent edit, newest first. Each line names the audience and its
 * states as flat labels (the state's glyph and word in its tone), at most two and then a "+N" that names the others. After five lines a muted
 * last line counts the versions not shown. Each line ends with its most recent edit as a short relative time. Information only: nothing in it is clickable.
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
  const stateWord = (item: DocumentVersionStatusItem, state: VersionState) => {
    if (state === 'published') return t('release.chip.published')
    if (state === 'draft') return t('release.chip.draft')
    // Faheem, 22 Oct: every release is named (no date), ASAP and undecided too; its glyph tells its kind.
    return item.release?.metadata.title || t('release.placeholder-untitled-release')
  }

  return (
    // The tooltip's own card is the popover's shell: the lines run edge to edge inside it (the margin takes back its 8px padding), 400px
    // wide as in the v1 design (the tooltip's boundary is the page, see PreviewTooltip).
    <Stack data-testid="document-versions-status" style={{margin: -8, width: WIDTH}}>
      {shown.map((group, index) => {
        const states = group.items.map((item) => ({item, state: stateOf(item)}))
        const hidden = states.slice(SHOWN_STATES)
        return (
          <Flex
            align="center"
            data-testid="audience-line"
            gap={4}
            key={group.variantId ?? 'default'}
            style={{
              boxShadow: index ? 'inset 0 1px 0 var(--card-hairline-soft-color)' : undefined,
              padding: '9px 12px',
            }}
          >
            {/* The audience's name keeps its width (down to 96px), the labels give way first, and the time never does. */}
            {variantsEnabled || group.variantId ? (
              <Box style={{flex: '0 1 auto', minWidth: 96}}>
                <Text size={1} textOverflow="ellipsis">
                  {audienceTitle(group.variantId)}
                </Text>
              </Box>
            ) : null}
            <Flex
              gap={1}
              justify="flex-end"
              style={{flex: '1 1 0%', minWidth: 0, overflow: 'hidden'}}
            >
              {states.slice(0, SHOWN_STATES).map(({item, state}) => (
                <StateLabel key={item.version._id} state={state} text={stateWord(item, state)} />
              ))}
              {hidden.length ? (
                <Card
                  aria-label={hidden.map(({item, state}) => stateWord(item, state)).join(', ')}
                  data-testid="state-more"
                  style={{
                    alignItems: 'center',
                    display: 'inline-flex',
                    height: 25,
                    padding: '0 4px',
                  }}
                  title={hidden.map(({item, state}) => stateWord(item, state)).join(', ')}
                  tone="inherit"
                >
                  <Text muted size={1}>{`+${hidden.length}`}</Text>
                </Card>
              ) : null}
            </Flex>
            <LineTime time={newestEdit(group)} />
          </Flex>
        )
      })}
      {more > 0 ? (
        <Card borderTop data-testid="document-versions-status-more" style={{padding: '9px 12px'}}>
          <Text muted size={1}>
            {t('document-group.status.more', {count: more})}
          </Text>
        </Card>
      ) : null}
    </Stack>
  )
}

/**
 * PROPOSED (Faheem, 22 Oct, option B): the line's most recent edit, as core's compact relative time ("now", "5 min", "3 days", "2 wk",
 * "1 mo"; a few characters at most, never a date), muted, in a right column so the lines' times align. Stock Studio's status says "Edited 2 wk. ago" the same way.
 */
function LineTime({time}: {time: number}) {
  const label = useCompactRelativeTime(new Date(time))
  if (!time) return null
  return (
    <Box data-testid="audience-line-time" flex="none" style={{minWidth: 48, textAlign: 'right'}}>
      <Text muted size={1} style={{fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap'}}>
        {label}
      </Text>
    </Box>
  )
}

/** A state as a flat label: its glyph and word in the state's tone, on no fill and with no border. Not a control. */
function StateLabel({state, text}: {state: VersionState; text: string}) {
  return (
    <Card
      data-state={state}
      data-testid={`state-${state}`}
      style={{
        alignItems: 'center',
        background: 'transparent',
        display: 'inline-flex',
        gap: 8,
        height: 25,
        padding: '0 4px',
        maxWidth: LABEL_MAX,
        minWidth: 0,
        whiteSpace: 'nowrap',
      }}
      title={text}
      tone={STATE_TONE[state]}
    >
      <Text size={1}>
        {state === 'published' ? (
          <ReleaseAvatarIcon release={PUBLISHED} />
        ) : state === 'draft' ? (
          <ReleaseAvatarIcon release={LATEST} />
        ) : (
          <ReleaseAvatarIcon releaseType={state} />
        )}
      </Text>
      <Box style={{minWidth: 0}}>
        <Text size={1} textOverflow="ellipsis">
          {text}
        </Text>
      </Box>
    </Card>
  )
}
