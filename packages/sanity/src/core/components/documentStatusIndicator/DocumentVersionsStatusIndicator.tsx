import {type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Flex, Icon} from 'ui5'

import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {type TargetPerspective} from '../../perspective/types'
import {usePerspective} from '../../perspective/usePerspective'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {CircleSmallIcon} from '../temporary-icons/CircleSmall'
import {RhombusIcon} from '../temporary-icons/Rhombus'
import {RingIcon} from '../temporary-icons/Ring'
import {type DocumentStatusIconKind, resolveDocumentStatusIcons} from './resolveDocumentStatusIcons'

interface DocumentStatusProps {
  documentVersions: VersionInfoDocumentStub[]
}

const IconSlotRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  flex-shrink: 0;

  &[data-status='published'] {
    --card-icon-color: var(--card-badge-positive-dot-color);
  }
  &[data-status='published'] svg {
    --icon-color: var(--card-badge-positive-dot-color);
  }
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='draft'] svg {
    --icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='variant'] {
    --card-icon-color: var(--card-badge-suggest-dot-color);
  }
  &[data-status='variant'] svg {
    --icon-color: var(--card-badge-suggest-dot-color);
  }

  & svg {
    flex-shrink: 0;
  }
`

/**
 * Centers a status glyph in a fixed 15px column. Draft, published, and variant slots set
 * `--icon-color` on the svg (ui5 `Icon` re-declares that variable on the element, shadowing an
 * ancestor) and `--card-icon-color` on the root for v4 call sites. Release uses
 * `ReleaseAvatarIcon`, which sets both variables inline on its `Icon`. Glyphs use ui5
 * `Icon size={2}` (or `ReleaseAvatarIcon` with `fontSize={2}`), not v4 `Text` descendant rules.
 */
function IconSlot({
  status,
  children,
}: {
  status?: 'published' | 'draft' | 'variant'
  children: ReactNode
}) {
  return <IconSlotRoot data-status={status}>{children}</IconSlotRoot>
}

function VariantIcon() {
  return (
    <IconSlot status="variant">
      <Icon icon={RhombusIcon} size={2} />
    </IconSlot>
  )
}

/**
 * A single document status glyph in its 15px slot. `release` is the perspective the release icon
 * is drawn for; the other kinds ignore it.
 *
 * @internal
 */
export function DocumentStatusIcon({
  kind,
  release,
}: {
  kind: DocumentStatusIconKind
  release?: TargetPerspective
}) {
  switch (kind) {
    case 'variant':
      return <VariantIcon />
    case 'release':
      return release ? (
        <IconSlot>
          <ReleaseAvatarIcon release={release} size="small" fontSize={2} />
        </IconSlot>
      ) : null
    case 'draft':
      return (
        <IconSlot status="draft">
          <Icon icon={RingIcon} size={2} />
        </IconSlot>
      )
    case 'published':
      return (
        <IconSlot status="published">
          <Icon icon={CircleSmallIcon} size={2} />
        </IconSlot>
      )
    default: {
      const unknownKind: never = kind
      return unknownKind
    }
  }
}

/**
 * Renders icons describing the document's status in the selected perspective and variant. The
 * perspective decides what the icons describe, and the selected variant then narrows it. Icons
 * appear in a fixed order: the rhombus (variant), the release icon, the yellow draft ring, then the
 * green published disc. At most three render at once.
 *
 * See `resolveDocumentStatusIcons.ts` for the full decision logic.
 *
 * @internal
 */
export function DocumentVersionsStatusIndicator({documentVersions}: DocumentStatusProps) {
  const {bundle, selectedPerspective, selectedVariants} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)

  const icons = resolveDocumentStatusIcons({
    bundle,
    variantId: selectedVariant?._id,
    documentVersions,
  })

  if (icons.length === 0) {
    return null
  }

  return (
    <Flex alignItems="center">
      {icons.map((icon) => (
        <DocumentStatusIcon key={icon} kind={icon} release={selectedPerspective} />
      ))}
    </Flex>
  )
}
