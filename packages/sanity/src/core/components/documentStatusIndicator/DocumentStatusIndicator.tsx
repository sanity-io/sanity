import {DotIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {type VersionsRecord} from '../../preview/utils/getPreviewStateObservable'

interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
  version?: PreviewValue | Partial<SanityDocument> | null
  // eslint-disable-next-line
  versions?: VersionsRecord
}

const Root = styled(Text)`
  &[data-status='edited'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='unpublished'] {
    --card-icon-color: var(--card-badge-default-dot-color);
    opacity: 0.5 !important;
  }
`

/**
 * Renders a dot indicating the current document status.
 *
 * - Yellow (caution) for published documents with edits
 * - Gray (default) for unpublished documents (with or without edits)
 *
 * No dot will be displayed for published documents without edits or for version documents.
 *
 * @internal
 */
export function DocumentStatusIndicator({draft, published, version}: DocumentStatusProps) {
  const $draft = Boolean(draft)
  const $published = Boolean(published)
  const $version = Boolean(version)

  const status = useMemo(() => {
    if ($version) return undefined
    if ($draft && !$published) return 'unpublished'
    return 'edited'
  }, [$draft, $published, $version])

  // Return null if the document is:
  // - Published without edits
  // - Neither published or without edits (this shouldn't be possible)
  // - A version
  if ((!$draft && !$published) || (!$draft && $published) || $version) {
    return null
  }

  // TODO: Remove debug `status[0]` output.
  return (
    <Root data-status={status} size={1}>
      <DotIcon />
    </Root>
  )
}
