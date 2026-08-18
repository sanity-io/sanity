import {Card, Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {css, styled} from 'styled-components'

import {usePerspective} from '../../perspective/usePerspective'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {isSystemBundle} from '../../util/draftUtils'
import {getTargetDocument, getVariantPublishedSibling} from '../../util/getTargetDocument'
import {CircleSmallIcon} from '../temporary-icons/CircleSmall'
import {RhombusIcon} from '../temporary-icons/Rhombus'
import {RingIcon} from '../temporary-icons/Ring'

interface DocumentStatusProps {
  documentVersions: VersionInfoDocumentStub[]
}

/**
 * The tone tokens the icons normally use have no contrast against the accent background of a
 * selected or pressed preview card, so there the icons follow the card's own foreground color
 * instead — the same treatment `PreviewCard` gives `TextWithTone`. The shapes stay distinct.
 */
const selectedPreviewCardColor = css`
  [data-ui='PreviewCard'][data-selected] &,
  [data-ui='PreviewCard'][data-pressed] &,
  [data-ui='PreviewCard']:active & {
    /* The icons take their color from --card-icon-color, so overriding that variable is not enough:
       the release icons set it inline per tone. They have to be overridden directly. */
    [data-sanity-icon] {
      color: inherit;
    }
  }
`

const IconSlotRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  flex-shrink: 0;

  &[data-status='published'] {
    --card-icon-color: var(--card-badge-positive-dot-color);
  }
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='variant'] {
    --card-icon-color: var(--card-accent-fg-color);
  }

  ${selectedPreviewCardColor}
`

/**
 * The icons are `1em` boxes in a 25-unit viewBox, like everything in `@sanity/icons`, so a `Text` is
 * what sizes them: it resolves the em to the text size's icon size — 17px at size 0 — and applies
 * the negative margin that centres the glyph on the cap height. It is also what makes them honour
 * `--card-icon-color`, which is how each icon gets its tone.
 */
function IconSlot({
  status,
  children,
}: {
  status?: 'published' | 'draft' | 'variant'
  children: ReactNode
}) {
  return (
    <IconSlotRoot data-status={status}>
      <Text size={2}>{children}</Text>
    </IconSlotRoot>
  )
}

// Purple, matching the perspective bar's variant motif. The --card-badge-* vars only exist inside a
// Badge, so a transparent suggest-toned Card provides --card-icon-color for the filled icon.
const VariantIconCard = styled(Card)`
  background-color: transparent;

  ${selectedPreviewCardColor}
`

function VariantIcon() {
  return (
    <VariantIconCard tone="suggest">
      <IconSlot status="variant">
        <RhombusIcon />
      </IconSlot>
    </VariantIconCard>
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
          <ReleaseAvatarIcon release={selectedPerspective} size="small" />
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
        {variantTarget.draft && (
          <IconSlot status="draft">
            <RingIcon />
          </IconSlot>
        )}
        {variantTarget.published && (
          <IconSlot status="published">
            <CircleSmallIcon />
          </IconSlot>
        )}
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
      {draft && (
        <IconSlot status="draft">
          <RingIcon />
        </IconSlot>
      )}
      {published && (
        <IconSlot status="published">
          <CircleSmallIcon />
        </IconSlot>
      )}
    </Flex>
  )
}
