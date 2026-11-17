import {type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Flex, Icon} from 'ui5'

import {VariantMark} from '../../../ui-components/variantMark'
import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {type TargetPerspective} from '../../perspective/types'
import {usePerspective} from '../../perspective/usePerspective'
import {ReleaseAvatar} from '../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {CircleSmallIcon} from '../temporary-icons/CircleSmall'
import {RingIcon} from '../temporary-icons/Ring'
import {type DocumentStatusIconKind, resolveDocumentStatusIcons} from './resolveDocumentStatusIcons'

interface DocumentStatusProps {
  documentVersions: VersionInfoDocumentStub[]
}

const ICON_SLOT_WIDTH = 15

const IconSlotRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${ICON_SLOT_WIDTH}px;
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
 * The cluster when a variant is selected: a leading column for the variant rhombus, empty on rows
 * without one, then the status marks right-aligned in room for two more slots. The fixed width
 * puts the rhombus, and the last status mark, at one x on every row of a list.
 */
const VariantColumnsRoot = styled.div`
  display: flex;
  align-items: center;
  width: ${ICON_SLOT_WIDTH * 3}px;
  flex-shrink: 0;
`

const VariantColumnSlot = styled.div`
  display: flex;
  width: ${ICON_SLOT_WIDTH}px;
  flex-shrink: 0;
`

const StatusMarksColumn = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  min-width: 0;
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
      <VariantMark size="inline" />
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
          <ReleaseAvatar release={release} size="small" padding={2} />
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
 * With a variant selected, the rhombus gets a fixed leading column (empty when the row has none)
 * and the other marks are right-aligned after it, so the rhombus and the last status mark line up
 * down a list. With no variant selected, the icons are packed as they come.
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

  if (selectedVariant) {
    const statusIcons = icons.filter((icon) => icon !== 'variant')
    return (
      <VariantColumnsRoot data-testid="document-status-indicator">
        <VariantColumnSlot>{icons.includes('variant') && <VariantIcon />}</VariantColumnSlot>
        <StatusMarksColumn>
          {statusIcons.map((icon) => (
            <DocumentStatusIcon key={icon} kind={icon} release={selectedPerspective} />
          ))}
        </StatusMarksColumn>
      </VariantColumnsRoot>
    )
  }

  return (
    <Flex alignItems="center" data-testid="document-status-indicator">
      {icons.map((icon) => (
        <DocumentStatusIcon key={icon} kind={icon} release={selectedPerspective} />
      ))}
    </Flex>
  )
}
