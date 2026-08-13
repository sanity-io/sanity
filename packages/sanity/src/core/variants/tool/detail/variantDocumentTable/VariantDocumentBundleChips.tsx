import {type ReleaseDocument} from '@sanity/client'
import {Badge, Box, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ReleaseAvatarIcon} from '../../../../releases/components/ReleaseAvatar'
import {ReleaseTitle} from '../../../../releases/components/ReleaseTitle'
import {RELEASES_INTENT} from '../../../../releases/plugin'
import {getReleaseIdFromReleaseDocumentId} from '../../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {variantsLocaleNamespace} from '../../../i18n'
import {getSortedRowBundles, type ReleaseLaneKind} from '../releaseLane'
import {type VariantDocumentVersion} from '../types'

// Only one chip fits comfortably in the fixed-width cell; the rest collapse into a "+N" badge
// whose hover tooltip lists them, so the row never crops or scrolls horizontally.
const MAX_VISIBLE_CHIPS = 1

interface ResolvedChip {
  key: string
  kind: ReleaseLaneKind
  release?: ReleaseDocument
}

function useChipLabel() {
  const {t} = useTranslation()

  return (chip: ResolvedChip): string => {
    if (chip.kind === 'published') return t('release.chip.published')
    if (chip.kind === 'drafts') return t('release.chip.draft')
    return chip.release?.metadata?.title ?? t('release.placeholder-untitled-release')
  }
}

function getChipTone(kind: ReleaseLaneKind): 'positive' | 'primary' | 'default' {
  if (kind === 'published') return 'positive'
  if (kind === 'release') return 'primary'
  return 'default'
}

// The shared perspective-bar iconography (dot / bolt / clock, tone-coloured). Used only in the
// overflow list — the visible chips lean on their badge tone, and the document preview already
// carries this icon per row, so repeating it on the chip would be redundant.
function ChipIcon({chip}: {chip: ResolvedChip}) {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  if (chip.kind === 'published') return <ReleaseAvatarIcon tone="positive" />
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  if (chip.kind === 'drafts') return <ReleaseAvatarIcon tone="caution" />
  if (chip.release) return <ReleaseAvatarIcon release={chip.release} />
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return <ReleaseAvatarIcon tone="default" />
}

function ReleaseBundleChip({release}: {release: ReleaseDocument}) {
  const {t} = useTranslation()
  const releaseId = getReleaseIdFromReleaseDocumentId(release._id)

  return (
    <ReleaseTitle
      title={release.metadata?.title}
      fallback={t('release.placeholder-untitled-release')}
    >
      {({displayTitle}) => (
        <IntentLink intent={RELEASES_INTENT} params={{id: releaseId}}>
          {/* Constrain to a single line so a long release name truncates with an ellipsis instead
              of wrapping into a tall, heavy two-line filled badge that dominates the row. */}
          <Badge
            radius={2}
            style={{
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={displayTitle}
            tone="primary"
          >
            {displayTitle}
          </Badge>
        </IntentLink>
      )}
    </ReleaseTitle>
  )
}

function VisibleChip({chip, label}: {chip: ResolvedChip; label: string}) {
  if (chip.kind === 'release' && chip.release) {
    return <ReleaseBundleChip release={chip.release} />
  }
  return (
    <Badge radius={2} tone={getChipTone(chip.kind)}>
      {label}
    </Badge>
  )
}

export function VariantDocumentBundleChips({
  versions,
  releasesById,
}: {
  versions: VariantDocumentVersion[]
  releasesById: Map<string, ReleaseDocument>
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const getLabel = useChipLabel()

  // Dedupe by bundle and order like the release lane / preview primary badge so the visible
  // chip always matches the leading icon when a document appears in multiple releases.
  const chips = useMemo<ResolvedChip[]>(() => {
    return getSortedRowBundles(versions, releasesById).map((resolved) => ({
      key: resolved.id,
      kind: resolved.kind,
      release: resolved.release,
    }))
  }, [versions, releasesById])

  const visible = chips.slice(0, MAX_VISIBLE_CHIPS)
  const overflow = chips.slice(MAX_VISIBLE_CHIPS)

  return (
    <Flex align="center" gap={2} style={{minWidth: 0, overflow: 'hidden'}} wrap="nowrap">
      {visible.map((chip) => (
        <Box key={chip.key} style={{minWidth: 0, overflow: 'hidden'}}>
          <VisibleChip chip={chip} label={getLabel(chip)} />
        </Box>
      ))}
      {overflow.length > 0 && (
        <Tooltip
          content={
            <Stack gap={3} padding={1}>
              <Text muted size={0} weight="medium">
                {t('detail.documents.appears-in.also-in')}
              </Text>
              <Stack gap={2}>
                {overflow.map((chip) => (
                  <Flex align="center" gap={2} key={chip.key}>
                    <Text size={0}>
                      <ChipIcon chip={chip} />
                    </Text>
                    <Text size={1}>{getLabel(chip)}</Text>
                  </Flex>
                ))}
              </Stack>
            </Stack>
          }
          placement="bottom-start"
          portal
        >
          <Badge data-testid="variant-bundle-chips-overflow" radius={2} tone="default">
            {`+${overflow.length}`}
          </Badge>
        </Tooltip>
      )}
    </Flex>
  )
}
