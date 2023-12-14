import {DotIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useMemo} from 'react'
import styled, {css} from 'styled-components'

export interface DocumentStatusProps {
  draft?: PreviewValue | Partial<SanityDocument> | null
  hidePublishedStatus?: boolean
  published?: PreviewValue | Partial<SanityDocument> | null
}

const Root = styled(Text)<{
  $draft: boolean
  $hidePublishedStatus: boolean
  $published: boolean
}>((props) => {
  const {$draft, $hidePublishedStatus, $published} = props

  return css`
    display: ${$hidePublishedStatus && $published && !$draft ? 'none' : 'block'};
    opacity: ${$hidePublishedStatus && $published && !$draft ? 0 : 1};

    &[data-status='published'] {
      --card-icon-color: var(--card-badge-positive-dot-color);
    }
    &[data-status='edited'] {
      --card-icon-color: var(--card-badge-caution-dot-color);
    }
    &[data-status='unpublished'] {
      --card-icon-color: var(--card-badge-default-dot-color);
      opacity: 0.5 !important;
    }

    [data-ui='PreviewCard']:hover & {
      opacity: 1;
    }
    [data-ui='PreviewCard'][data-selected] & {
      opacity: 1;
    }
    [data-ui='ReferenceLinkCard']:hover & {
      opacity: 1;
    }
  `
})

/**
 * Renders a dot indicating the current document status.
 *
 * - Green (primary) for published documents with no edits
 * - Yellow (caution) for published documents with edits
 * - Gray (default) for unpublished documents (with or without edits)
 *
 * @internal
 */
export function DocumentStatusIndicator({
  draft,
  hidePublishedStatus,
  published,
}: DocumentStatusProps) {
  const $draft = !!draft
  const $published = !!published
  const $hidePublishedStatus = !!hidePublishedStatus

  const status = useMemo(() => {
    if (!$draft && $published) return 'published'
    if ($draft && !$published) return 'unpublished'
    return 'edited'
  }, [$draft, $published])

  if (!$draft && !$published) {
    return null
  }

  return (
    <Root
      $draft={$draft}
      $hidePublishedStatus={$hidePublishedStatus}
      $published={$published}
      data-status={status}
      size={1}
    >
      <DotIcon />
    </Root>
  )
}
