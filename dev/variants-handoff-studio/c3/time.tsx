import {type ReactNode} from 'react'

import {getDocumentVersionStatusTimestampKey} from '../../../packages/sanity/src/core/components/documentStatus/getDocumentVersionStatusTimestampKey'
import {useRelativeTime} from '../../../packages/sanity/src/core/hooks/useRelativeTime'
import {useTranslation} from '../../../packages/sanity/src/core/i18n/hooks/useTranslation'
import {type VersionInfoDocumentStub} from '../../../packages/sanity/src/core/releases/store/types'
import {type AudienceVersion} from './types'

/**
 * The muted time line of one version, as the Studio's own status list writes it: the real
 * `useRelativeTime` (minimal, temporal phrase) and the real `document-status.*` strings picked by
 * `getDocumentVersionStatusTimestampKey`: "Published {date}", "Created {date}" when never edited, else "Edited {date}".
 * LIVE: ported from the Storybook original, which counted from a fixed fixture clock. This reads the version
 * document's real `_createdAt` / `_updatedAt`. `null` for a version that carries no time.
 */
export function useVersionTime(version: AudienceVersion): string | null {
  const {t} = useTranslation()
  const updatedAt = version.updatedAt
  const createdAt = version.createdAt ?? updatedAt
  const date = useRelativeTime(updatedAt ?? new Date(0).toISOString(), {
    minimal: true,
    useTemporalPhrase: true,
  })
  if (!updatedAt || !createdAt) return null
  const bundleId =
    version.bundleId && version.bundleId !== 'published' ? version.bundleId : undefined
  // The stub carries only what the key function reads.
  const stub = {
    _id: bundleId ? `versions.${bundleId}.doc` : 'doc',
    _rev: 'live',
    _createdAt: createdAt,
    _updatedAt: updatedAt,
    _type: 'doc',
    _system: bundleId ? {bundleId} : {},
  } as unknown as VersionInfoDocumentStub
  return t(getDocumentVersionStatusTimestampKey(stub, false), {date})
}

/** The time line of a version as text, for a render prop (a tooltip, a line, a cell). */
export function VersionTime(props: {
  version: AudienceVersion
  children: (text: string | null) => ReactNode
}) {
  return <>{props.children(useVersionTime(props.version))}</>
}
