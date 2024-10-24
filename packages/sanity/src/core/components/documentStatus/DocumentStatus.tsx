import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'
import {type ComponentType, useMemo} from 'react'
import {
  isDraftId,
  isPublishedId,
  type PreparedSnapshot,
  type ReleaseDocument,
  useReleases,
} from 'sanity'

import {useRelativeTime} from '../../hooks'
import {useTranslation} from '../../i18n'
import {type VersionsRecord} from '../../preview/utils/getPreviewStateObservable'
import {type CurrentPerspective, ReleaseAvatar} from '../../releases'
import {RELEASE_DOCUMENTS_PATH} from '../../store/release/constants'

interface DocumentStatusProps {
  absoluteDate?: boolean
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  version?: PreviewValue | Partial<SanityDocument> | null
  versions?: VersionsRecord
  singleLine?: boolean
  currentGlobalBundle?: CurrentPerspective
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
  const {t} = useTranslation()
  const {releases} = useReleases()
  const versionsList = useMemo(() => Object.entries(versions ?? {}), [versions])

  return (
    <Flex
      align={singleLine ? 'center' : 'flex-start'}
      data-testid="pane-footer-document-status"
      direction={singleLine ? 'row' : 'column'}
      gap={3}
      wrap="nowrap"
    >
      {published && (
        <VersionStatus
          bundle={{
            _id: 'published',
            metadata: {
              title: 'Published',
            },
          }}
          version={{snapshot: published}}
        />
      )}
      {draft && (
        <VersionStatus
          bundle={{
            _id: 'draft',
            metadata: {
              title: 'Draft',
            },
          }}
          version={{snapshot: draft}}
        />
      )}
      {versionsList.map(([versionId, snapshot]) => (
        <VersionStatus
          key={versionId}
          bundle={releases.get([RELEASE_DOCUMENTS_PATH, versionId].join('.'))}
          version={snapshot}
        />
      ))}
    </Flex>
  )
}

type Mode = 'edited' | 'created' | 'draft' | 'published'

const VersionStatus: ComponentType<{
  bundle: ReleaseDocument | undefined
  version: PreparedSnapshot
}> = ({bundle, version}) => {
  const {t} = useTranslation()
  const mode = getMode(version)

  const timestamps: Record<Mode, string> = {
    draft: version.snapshot._updatedAt,
    published: version.snapshot._updatedAt,
    edited: version.snapshot._updatedAt,
    created: version.snapshot._createdAt,
  }

  const labels: Record<Mode, string> = {
    draft: 'document-status.edited',
    published: 'document-status.published',
    edited: 'document-status.edited',
    created: 'document-status.created',
  }

  const relativeTime = useRelativeTime(timestamps[mode], {
    minimal: true,
    useTemporalPhrase: true,
  })

  return (
    <Flex align="center" gap={2}>
      {/* TODO: Tone. */}
      <ReleaseAvatar tone="prospect" padding={0} />
      <Text size={1}>
        {bundle?.metadata.title}{' '}
        <span style={{color: 'var(--card-muted-fg-color)'}}>
          {t(labels[mode], {date: relativeTime})}
        </span>
      </Text>
    </Flex>
  )
}

function getMode(document: PreparedSnapshot): Mode {
  if (isDraftId(document.snapshot?._id)) {
    return 'draft'
  }

  if (isPublishedId(document.snapshot?._id)) {
    return 'published'
  }

  if (typeof document.snapshot?._updatedAt !== 'undefined') {
    return 'edited'
  }

  if (typeof document.snapshot?._createdAt !== 'undefined') {
    return 'created'
  }

  return 'edited'
}
