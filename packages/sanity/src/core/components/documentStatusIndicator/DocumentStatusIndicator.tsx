import {DotIcon} from '@sanity/icons'
import {type PreviewValue, type SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  published?: PreviewValue | Partial<SanityDocument> | null
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
 * No dot will be displayed for published documents without edits.
 *
 * @internal
 */
export function DocumentStatusIndicator({draft, published}: DocumentStatusProps) {
  const $draft = !!draft
  const $published = !!published

  const status = useMemo(() => {
    if ($draft && !$published) return 'unpublished'
    return 'edited'
  }, [$draft, $published])

  // Return null if the document is:
  // - Published without edits
  // - Neither published or without edits (this shouldn't be possible)
  if ((!$draft && !$published) || (!$draft && $published)) {
    return null
  }

  return (
    <Root data-status={status} size={1}>
      <DotIcon />
    </Root>
  )
}
