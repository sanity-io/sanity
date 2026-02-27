import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'

import {useRelativeTime} from '../../hooks'
import {useTranslation} from '../../i18n'
import {type TargetPerspective} from '../../perspective/types'
import {
  getReleaseIdFromReleaseDocumentId,
  ReleaseAvatar,
  useActiveReleases,
  type VersionInfoDocumentStub,
} from '../../releases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {useWorkspace} from '../../studio/workspace'

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

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

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
          release={PUBLISHED}
        />
      )}
      {isDraftModelEnabled && draft && (
        <VersionStatus
          title={t('release.chip.draft')}
          mode="draft"
          timestamp={draft._updatedAt}
          release={LATEST}
        />
      )}
      {versionsList.map(([versionName, snapshot]) => {
        if (!snapshot) {
          return null
        }
        const release = releases?.find(
          (r) => getReleaseIdFromReleaseDocumentId(r._id) === versionName,
        )
        if (!release) {
          return null
        }
        return (
          <VersionStatus
            key={versionName}
            mode={snapshot._updatedAt === snapshot._createdAt ? 'created' : 'edited'}
            title={release?.metadata.title || t('release.placeholder-untitled-release')}
            timestamp={snapshot?._updatedAt}
            release={release}
          />
        )
      })}
    </Flex>
  )
}

type Mode = 'edited' | 'created' | 'draft' | 'published'

const labels: Record<Mode, string> = {
  draft: 'document-status.edited',
  published: 'document-status.published',
  edited: 'document-status.edited',
  created: 'document-status.created',
}

const VersionStatus = ({
  title,
  timestamp,
  mode,
  release,
}: {
  title: string
  mode: Mode
  timestamp?: string
  release: TargetPerspective
}) => {
  const {t} = useTranslation()

  const relativeTime = useRelativeTime(timestamp || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  return (
    <Flex align="center" gap={2}>
      <ReleaseAvatar release={release} padding={0} />
      <Text size={1}>
        {title} -{' '}
        <span style={{color: 'var(--card-muted-fg-color)'}}>
          {t(labels[mode], {date: relativeTime})}
        </span>
      </Text>
    </Flex>
  )
}
