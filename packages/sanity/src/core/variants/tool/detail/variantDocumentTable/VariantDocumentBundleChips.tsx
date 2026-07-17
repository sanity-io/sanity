import {type ReleaseDocument} from '@sanity/client'
import {Badge, Box, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {Tooltip} from '../../../../../ui-components/tooltip'
import {useTranslation} from '../../../../i18n'
import {ReleaseTitle} from '../../../../releases/components/ReleaseTitle'
import {RELEASES_INTENT} from '../../../../releases/plugin'
import {getReleaseIdFromReleaseDocumentId} from '../../../../releases/util/getReleaseIdFromReleaseDocumentId'
import {type ReleaseLaneKind, resolveVersionBundle} from '../releaseLane'
import {type VariantDocumentVersion} from '../types'

// Only one chip fits comfortably in the fixed-width Bundle cell; the rest collapse into a
// "+N" overflow badge so the row never crops or scrolls horizontally.
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
          <Badge radius={2} tone="primary">
            {displayTitle}
          </Badge>
        </IntentLink>
      )}
    </ReleaseTitle>
  )
}

function StaticBundleChip({
  label,
  tone,
}: {
  label: string
  tone: 'positive' | 'primary' | 'default'
}) {
  return (
    <Badge radius={2} tone={tone}>
      {label}
    </Badge>
  )
}

function VisibleChip({chip, label}: {chip: ResolvedChip; label: string}) {
  if (chip.kind === 'release' && chip.release) {
    return <ReleaseBundleChip release={chip.release} />
  }
  return <StaticBundleChip label={label} tone={getChipTone(chip.kind)} />
}

export function VariantDocumentBundleChips({
  versions,
  releasesById,
}: {
  versions: VariantDocumentVersion[]
  releasesById: Map<string, ReleaseDocument>
}): React.JSX.Element {
  const getLabel = useChipLabel()

  // Dedupe by resolved bundle id so a document with several versions in the same bundle
  // shows a single chip.
  const chips = useMemo<ResolvedChip[]>(() => {
    const seen = new Map<string, ResolvedChip>()
    for (const version of versions) {
      const resolved = resolveVersionBundle(version, releasesById)
      if (!seen.has(resolved.id)) {
        seen.set(resolved.id, {key: resolved.id, kind: resolved.kind, release: resolved.release})
      }
    }
    return Array.from(seen.values())
  }, [versions, releasesById])

  const visible = chips.slice(0, MAX_VISIBLE_CHIPS)
  const overflow = chips.slice(MAX_VISIBLE_CHIPS)

  return (
    <Flex align="center" gap={1} wrap="nowrap" style={{minWidth: 0, overflow: 'hidden'}}>
      {visible.map((chip) => (
        <Box key={chip.key} style={{minWidth: 0, overflow: 'hidden'}}>
          <VisibleChip chip={chip} label={getLabel(chip)} />
        </Box>
      ))}
      {overflow.length > 0 && (
        <Tooltip
          portal
          placement="bottom-start"
          content={
            <Stack space={2} padding={1}>
              {overflow.map((chip) => (
                <Text key={chip.key} size={1}>
                  {getLabel(chip)}
                </Text>
              ))}
            </Stack>
          }
        >
          <Badge
            data-testid="variant-bundle-chips-overflow"
            mode="outline"
            radius={2}
            tone="default"
          >
            {`+${overflow.length}`}
          </Badge>
        </Tooltip>
      )}
    </Flex>
  )
}
