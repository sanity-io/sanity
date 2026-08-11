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

/**
 * Yellow draft ring followed by the green published disc.
 *
 * When `allowDraftOnly` is false (system perspective), a document that has never been published
 * gets no status icons. When true (selected variant), a draft-only document still shows the yellow
 * ring — matching the Studio Patterns status stack.
 */
function StatusDots({
  draft,
  published,
  allowDraftOnly = false,
}: {
  draft: boolean
  published: boolean
  allowDraftOnly?: boolean
}) {
  if (!published && !(allowDraftOnly && draft)) {
    return null
  }

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
 * Renders icons describing the document's status in the selected perspective and variant. Icons
 * appear in a fixed order: the rhombus (variant), the release icon, the yellow draft ring, then the
 * green published disc. At most three render at once.
 *
 * Variant: none | Perspective: system (published or drafts)
 *   - Published: green disc.
 *   - Published & draft: yellow ring and green disc.
 *   - Draft only (not published yet): nothing.
 *
 * Variant: selected | Perspective: system (published or drafts)
 *   - Has document in the variant (in either system bundle)?
 *     - No: falls back to the default variant icons above.
 *     - Yes: rhombus icon, plus the dots for the variant's own published and draft documents
 *       (draft-only variants still show the yellow ring).
 *
 * Variant: none | Perspective: a release or agent bundle
 *   - Has document in the selected release: release icon (bolt, clock, or dot by release type;
 *     agent bundles get a suggest-toned dot).
 *   - Otherwise: nothing.
 *
 * Variant: selected | Perspective: a release or agent bundle
 *   - Has document in the variant within the release: rhombus icon.
 *   - Has document in the release itself: release icon.
 *   - Both: rhombus icon and release icon.
 *   - Neither: nothing.
 *
 * @internal
 */
export function DocumentStatusIndicator({documentVersions}: DocumentStatusProps) {
  const {bundle, selectedPerspective, selectedVariant} = usePerspective()

  // `undefined` while the variants store resolves, which degrades to the default variant.
  const variantId = selectedVariant?._id

  if (!isSystemBundle(bundle)) {
    const inVariant = variantId
      ? getTargetDocument({bundle, variant: variantId, documentVersions})
      : undefined
    const inPerspective = getTargetDocument({bundle, variant: undefined, documentVersions})

    return (
      <Flex align="center">
        {inVariant ? <VariantIcon /> : null}
        {inPerspective ? (
          <IconSlot>
            <Text size={0}>
              <ReleaseAvatarIcon release={selectedPerspective} />
            </Text>
          </IconSlot>
        ) : null}
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
          allowDraftOnly
          draft={Boolean(variantTarget.draft)}
          published={Boolean(variantTarget.published)}
        />
      </Flex>
    )
  }

  return (
    <Flex align="center">
      <StatusDots
        draft={Boolean(getTargetDocument({bundle: 'drafts', variant: undefined, documentVersions}))}
        published={Boolean(
          getTargetDocument({bundle: 'published', variant: undefined, documentVersions}),
        )}
      />
    </Flex>
  )
}
