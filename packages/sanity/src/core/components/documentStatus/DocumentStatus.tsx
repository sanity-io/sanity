import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {type BadgeTone, Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {useRelativeTime} from '../../hooks'
import {useTranslation} from '../../i18n'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  ReleaseAvatar,
  useActiveReleases,
  type VersionInfoDocumentStub,
} from '../../releases'

interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  versions?: Record<string, VersionInfoDocumentStub | undefined>
  singleLine?: boolean
}

/**
 * Displays document status indicating both last published and edited dates in either relative (the default)
 * or absolute formats.
 *
 * These can be displayed in a single or multi-line (the default) lockups.
 *
 * Example: `**Published Oct 16 2023** Edited 8m ago`
 *
 * @internal
 */
export function DocumentStatus({draft, published, versions, singleLine}: DocumentStatusProps) {
  const {data: releases} = useActiveReleases()
  const versionsList = useMemo(() => Object.entries(versions ?? {}), [versions])
  const {t} = useTranslation()

  return (
    <Flex
      align={singleLine ? 'center' : 'flex-start'}
      direction={singleLine ? 'row' : 'column'}
      gap={3}
      wrap="nowrap"
    >
      {published && (
        <VersionStatus
          title={t('release.chip.published')}
          mode="published"
          timestamp={published._updatedAt}
          tone={'positive'}
        />
      )}
      {draft && (
        <VersionStatus
          title={t('release.chip.draft')}
          mode="draft"
          timestamp={draft._updatedAt}
          tone="caution"
        />
      )}
      {versionsList.map(([versionName, snapshot]) => {
        if (!snapshot) {
          return null
        }
        const release = releases?.find(
          (r) => getReleaseIdFromReleaseDocumentId(r._id) === versionName,
        )
        return (
          <VersionStatus
            key={versionName}
            mode={snapshot?._updatedAt === snapshot?._createdAt ? 'created' : 'edited'}
            title={release?.metadata.title || t('release.placeholder-untitled-release')}
            timestamp={snapshot?._updatedAt}
            tone={release ? getReleaseTone(release) : 'default'}
          />
        )
      })}
    </Flex>
  )
}

type Mode = 'edited' | 'created' | 'draft' | 'published'

const labels: Record<Mode, string> = {
  draft: 'document-status.edited',
  published: 'document-status.date',
  edited: 'document-status.edited',
  created: 'document-status.created',
}

const VersionStatus = ({
  title,
  timestamp,
  mode,
  tone,
}: {
  title: string | undefined
  mode: Mode
  timestamp?: string
  tone: BadgeTone
}) => {
  const {t} = useTranslation()

  const relativeTime = useRelativeTime(timestamp || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  return (
    <Flex align="center" gap={2}>
      <ReleaseAvatar tone={tone} padding={0} />
      <Text size={1}>
        {title || t('release.placeholder-untitled-release')}{' '}
        <span style={{color: 'var(--card-muted-fg-color)'}}>
          {t(labels[mode], {date: relativeTime})}
        </span>
      </Text>
    </Flex>
  )
}
