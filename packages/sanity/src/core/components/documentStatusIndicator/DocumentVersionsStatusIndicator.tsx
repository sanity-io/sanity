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
    --icon-color: var(--card-badge-positive-dot-color);
  }
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
    --icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='variant'] {
    --card-icon-color: var(--card-badge-suggest-dot-color);
    --icon-color: var(--card-badge-suggest-dot-color);
  }
`

/**
 * Centers a status glyph in a fixed 15px column. Draft, published, and variant slots set
 * `--card-icon-color` and `--icon-color` on the root so ui5 `Icon` picks up badge dot colors;
 * release uses `ReleaseAvatarIcon`, which sets `--icon-color` on its own `Icon`. Glyphs are sized
 * with ui5 `Icon size={2}` (or `ReleaseAvatarIcon` with `fontSize={2}`), not v4 `Text` descendant
 * rules.
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

function renderDocumentStatusIcon(
  icon: DocumentStatusIconKind,
  selectedPerspective: TargetPerspective,
) {
  switch (icon) {
    case 'variant':
      return <VariantIcon key="variant" />
    case 'release':
      return (
        <IconSlot key="release">
          <ReleaseAvatarIcon release={selectedPerspective} size="small" fontSize={2} />
        </IconSlot>
      )
    case 'draft':
      return (
        <IconSlot key="draft" status="draft">
          <Icon icon={RingIcon} size={2} />
        </IconSlot>
      )
    case 'published':
      return (
        <IconSlot key="published" status="published">
          <Icon icon={CircleSmallIcon} size={2} />
        </IconSlot>
      )
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
      {icons.map((icon) => renderDocumentStatusIcon(icon, selectedPerspective))}
    </Flex>
  )
}
