import {Flex, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

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
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='variant'] {
    --card-icon-color: var(--card-badge-suggest-dot-color);
  }
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

function VariantIcon() {
  return (
    <IconSlot status="variant">
      <RhombusIcon />
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
          <ReleaseAvatarIcon release={selectedPerspective} size="small" />
        </IconSlot>
      )
    case 'draft':
      return (
        <IconSlot key="draft" status="draft">
          <RingIcon />
        </IconSlot>
      )
    case 'published':
      return (
        <IconSlot key="published" status="published">
          <CircleSmallIcon />
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
  const {bundle, selectedPerspective, selectedVariant} = usePerspective()

  const icons = resolveDocumentStatusIcons({
    bundle,
    variantId: selectedVariant?._id,
    documentVersions,
  })

  if (icons.length === 0) {
    return null
  }

  return (
    <Flex align="center">
      {icons.map((icon) => renderDocumentStatusIcon(icon, selectedPerspective))}
    </Flex>
  )
}
