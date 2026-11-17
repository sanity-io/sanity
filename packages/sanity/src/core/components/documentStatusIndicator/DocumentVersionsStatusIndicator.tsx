import {type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Flex, Icon} from 'ui5'

import {VariantMark} from '../../../ui-components/variantMark'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getDefaultVariant} from '../../perspective/getDefaultVariant'
import {type TargetPerspective} from '../../perspective/types'
import {usePerspective} from '../../perspective/usePerspective'
import {ReleaseAvatar} from '../../releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {getVariantTitle} from '../../variants/tool/util'
import {CircleSmallIcon} from '../temporary-icons/CircleSmall'
import {RingIcon} from '../temporary-icons/Ring'
import {type DocumentStatusIconKind, resolveDocumentStatusIcons} from './resolveDocumentStatusIcons'

interface DocumentStatusProps {
  documentVersions: VersionInfoDocumentStub[]
  /**
   * Whether the row ends with the filled or outline variant diamond while a variant is selected.
   * Document lists and search results show it; reference field previews pass `false`, so a
   * reference shows only the status marks of the version it resolves to.
   */
  variantMarks?: boolean
}

const VARIANT_MARKS: ReadonlySet<DocumentStatusIconKind> = new Set(['variant', 'variant-empty'])

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
 * The cluster when a variant is selected: room for three slots, packed to the right. Every row ends
 * with the filled or outline diamond, so the diamond sits at one x down a list and the status marks
 * sit directly before it.
 */
const VariantClusterRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: ${ICON_SLOT_WIDTH * 3}px;
  flex-shrink: 0;
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
  label,
  children,
}: {
  status?: 'published' | 'draft' | 'variant'
  /** Names the glyph for assistive technology. Unlabelled slots stay unnamed, as before. */
  label?: string
  children: ReactNode
}) {
  return (
    <IconSlotRoot data-status={status} role={label ? 'img' : undefined} aria-label={label}>
      {children}
    </IconSlotRoot>
  )
}

/**
 * A single document status glyph in its 15px slot. `release` is the perspective the release icon
 * is drawn for; the other kinds ignore it. `label` names the variant diamonds.
 *
 * @internal
 */
export function DocumentStatusIcon({
  kind,
  release,
  label,
}: {
  kind: DocumentStatusIconKind
  release?: TargetPerspective
  label?: string
}) {
  switch (kind) {
    case 'variant':
      return (
        <IconSlot status="variant" label={label}>
          <VariantMark size="inline" />
        </IconSlot>
      )
    case 'variant-empty':
      return (
        <IconSlot status="variant" label={label}>
          <VariantMark size="inline" fill="outline" />
        </IconSlot>
      )
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
 * perspective decides what the icons describe, and the selected variant then narrows it.
 *
 * The diamond says which audience the status marks describe; it never means "this document has
 * variants". With no variant selected there is no diamond, the marks describe Default and are
 * packed as they come. With a variant selected every row ends with a diamond: filled when the
 * document has a version for that variant (the marks describe that version), outline when it has
 * none (the marks describe Default). The cluster is a fixed three-slot box packed to the right, so
 * the diamond sits at one x down a list and the marks sit directly before it.
 *
 * See `resolveDocumentStatusIcons.ts` for the full decision logic.
 *
 * @internal
 */
export function DocumentVersionsStatusIndicator({
  documentVersions,
  variantMarks = true,
}: DocumentStatusProps) {
  const {bundle, selectedPerspective, selectedVariants} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)
  const {t} = useTranslation()

  const resolvedIcons = resolveDocumentStatusIcons({
    bundle,
    variantId: selectedVariant?._id,
    documentVersions,
  })
  const icons = variantMarks
    ? resolvedIcons
    : resolvedIcons.filter((icon) => !VARIANT_MARKS.has(icon))

  if (icons.length === 0) {
    return null
  }

  if (selectedVariant && variantMarks) {
    const variant = getVariantTitle(selectedVariant)
    return (
      <VariantClusterRoot data-testid="document-status-indicator">
        {icons.map((icon) => {
          let label: string | undefined
          if (icon === 'variant') {
            label = t('document-status.variant-mark.version', {variant})
          } else if (icon === 'variant-empty') {
            label = t('document-status.variant-mark.no-version', {variant})
          }
          return (
            <DocumentStatusIcon
              key={icon}
              kind={icon}
              release={selectedPerspective}
              label={label}
            />
          )
        })}
      </VariantClusterRoot>
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
