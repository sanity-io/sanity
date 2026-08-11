import {Card, Flex, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {css, styled} from 'styled-components'

import {usePerspective} from '../../perspective/usePerspective'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isSystemBundle} from '../../util/draftUtils'
import {getTargetDocument, getVariantPublishedSibling} from '../../util/getTargetDocument'
import {
  DraftStatusIcon,
  PublishedStatusIcon,
  VariantStatusIcon,
} from './DocumentStatusIndicatorIcons'

interface DocumentStatusProps {
  documentVersions: VersionInfoDocumentStub[]
}

type Status = 'published' | 'draft'

/**
 * The tone tokens the icons normally use have no contrast against the accent background of a
 * selected or pressed preview card, so there the icons follow the card's own foreground color
 * instead — the same treatment `PreviewCard` gives `TextWithTone`. The shapes stay distinct.
 */
const selectedPreviewCardColor = css`
  [data-ui='PreviewCard'][data-selected] &,
  [data-ui='PreviewCard'][data-pressed] &,
  [data-ui='PreviewCard']:active & {
    color: inherit;

    /* ReleaseAvatarIcon sets --card-icon-color inline, so its icon has to be overridden directly. */
    [data-sanity-icon] {
      color: inherit;
    }
  }
`

const IconSlot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
  flex-shrink: 0;

  &[data-status='published'] {
    color: var(--card-badge-positive-dot-color);
  }
  &[data-status='draft'] {
    color: var(--card-badge-caution-dot-color);
  }
  &[data-status='variant'] {
    color: var(--card-accent-fg-color);
  }

  ${selectedPreviewCardColor}
`

// Purple, matching the perspective bar's variant motif. The --card-badge-* vars only exist inside a
// Badge, so a transparent suggest-toned Card provides --card-icon-color for the filled icon.
const VariantIconCard = styled(Card)`
  background-color: transparent;

  ${selectedPreviewCardColor}
`

function VariantIcon() {
  return (
    <VariantIconCard tone="suggest">
      <IconSlot data-status="variant">
        <VariantStatusIcon />
      </IconSlot>
    </VariantIconCard>
  )
}

/** Yellow draft ring followed by the green published disc. */
function StatusDots({draft, published}: {draft: boolean; published: boolean}) {
  const statuses: Status[] = []
  if (draft) statuses.push('draft')
  if (published) statuses.push('published')

  return (
    <>
      {statuses.map((status) => (
        <IconSlot key={status} data-status={status}>
          {status === 'draft' ? <DraftStatusIcon /> : <PublishedStatusIcon />}
        </IconSlot>
      ))}
    </>
  )
}

/**
 * Renders icons describing the document's status in the selected perspective and variant. The
 * perspective decides what the icons describe, and the selected variant then narrows it. Icons
 * appear in a fixed order: the rhombus (variant), the release icon, the yellow draft ring, then the
 * green published disc. At most three render at once.
 *
 * Perspective: system (published or drafts) — describes publish state.
 *   - Variant: none — describes the default documents:
 *     - Published: green disc.
 *     - Published & draft: yellow ring and green disc.
 *     - Draft only (not published yet): nothing.
 *   - Variant: selected — describes the variant's own documents, and takes over only when the
 *     document exists in the variant:
 *     - Not in the variant: falls back to the default documents above.
 *     - Published: rhombus and green disc.
 *     - Published & draft: rhombus, yellow ring and green disc.
 *     - Draft only (not published yet): rhombus and yellow ring.
 *
 * Perspective: a release or agent bundle — describes membership only, since versions in a release
 * have no publish state of their own.
 *   - Variant: none:
 *     - In the release: release icon (bolt, clock, or dot by release type; agent bundles get a
 *       suggest-toned dot).
 *     - Otherwise: nothing.
 *   - Variant: selected — a version scoped to the variant belongs to the release as much as a
 *     default one does, so the release icon still leads and the rhombus is only ever added on top of
 *     it, never shown alone:
 *     - In the release for the variant: rhombus and release icon, whether or not the release also
 *       holds a default version.
 *     - In the release for the default documents only: release icon.
 *     - Not in the release: nothing.
 *
 * @internal
 */
export function DocumentStatusIndicator({documentVersions}: DocumentStatusProps) {
  const {bundle, selectedPerspective, selectedVariant} = usePerspective()

  const variantId = selectedVariant?._id

  if (!isSystemBundle(bundle)) {
    const inVariant = variantId
      ? getTargetDocument({bundle, variant: variantId, documentVersions})
      : undefined
    const inDefault = getTargetDocument({bundle, variant: undefined, documentVersions})

    // Membership of the release is what the perspective dictates, so it gates the whole indicator. A
    // version scoped to the selected variant is a member of the release as much as a default one is,
    // so either grants the release icon and the rhombus is added on top.
    if (!inVariant && !inDefault) {
      return null
    }

    return (
      <Flex align="center">
        {inVariant ? <VariantIcon /> : null}
        <IconSlot>
          <Text size={0}>
            <ReleaseAvatarIcon release={selectedPerspective} />
          </Text>
        </IconSlot>
      </Flex>
    )
  }

  const variantTarget = variantId
    ? {
        draft: getTargetDocument({bundle: 'drafts', variant: variantId, documentVersions}),
        published: getVariantPublishedSibling({variant: variantId, documentVersions}),
      }
    : undefined

  // A selected variant only takes over the indicator when the document exists in it.
  if (variantTarget && (variantTarget.draft || variantTarget.published)) {
    return (
      <Flex align="center">
        <VariantIcon />
        <StatusDots
          draft={Boolean(variantTarget.draft)}
          published={Boolean(variantTarget.published)}
        />
      </Flex>
    )
  }

  const published = Boolean(
    getTargetDocument({bundle: 'published', variant: undefined, documentVersions}),
  )

  // For the default documents the draft ring reads as "unpublished changes", so it only means
  // something next to the published disc: a document that has never been published gets no icons at
  // all. A draft-only variant does keep its ring, because the rhombus already establishes that the
  // variant exists.
  const draft =
    published &&
    Boolean(getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions}))

  return (
    <Flex align="center">
      <StatusDots draft={draft} published={published} />
    </Flex>
  )
}
