import {type ReleaseDocument} from '@sanity/client'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {Text} from '@sanity/ui'
import {type MouseEventHandler, type ReactNode, type Ref} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {type Variant} from '../machines/selectionMachine'
import {StatusBadge} from './VariantSet/StatusBadge'
import {VariantSetEntry} from './VariantSet/VariantSetEntry'

/**
 * Shared row chrome for a document group version: primary-action overlay, name,
 * viewing badge, and release avatar. The inventory layers checkbox selection and
 * context-menu actions on top; the picker uses it as-is.
 *
 * @internal
 */
export function DocumentGroupEntry({
  variant,
  releases,
  isSelected,
  leading,
  onPrimaryAction,
  onContextMenu,
  primaryActionRef,
}: {
  variant: Variant
  releases: Map<string, ReleaseDocument>
  isSelected?: boolean
  leading?: ReactNode
  onPrimaryAction: () => void
  onContextMenu?: MouseEventHandler<HTMLButtonElement>
  primaryActionRef?: Ref<HTMLButtonElement>
}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const {document} = variant
  const isPublishedVersion = !document._system.bundleId
  const isDraftVersion = document._system.bundleId === 'drafts'
  const agentBundleName = isAgentBundleName(document._system.bundleId)
    ? document._system.bundleId
    : undefined
  const release = resolveVariantRelease(variant, releases)

  return (
    <VariantSetEntry data-variant-name={variant.name} data-selected={isSelected || undefined}>
      <div className="atom">
        <button
          type="button"
          className="primary-action"
          ref={primaryActionRef}
          onClick={onPrimaryAction}
          onContextMenu={onContextMenu}
        >
          {variant.name}
        </button>
        {leading}
        <Text size={1} weight="medium" className="inert">
          {variant.name}
        </Text>
      </div>
      <div className="atom inert">
        {isSelected && (
          <StatusBadge radius={2} tone="primary">
            <EyeOpenIcon /> {t('document-group-inventory.viewing-item-label')}
          </StatusBadge>
        )}
        <Text size={1}>
          {agentBundleName ? (
            // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
            <ReleaseAvatarIcon tone="suggest" />
          ) : (
            <ReleaseAvatarIcon
              release={
                // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals -- this string is not shown to users
                (isDraftVersion ? 'drafts' : isPublishedVersion ? 'published' : release) ?? ''
              }
            />
          )}
        </Text>
      </div>
    </VariantSetEntry>
  )
}

/**
 * Resolves the release document for a version, preferring the release attached
 * when the set was computed and falling back to the active-releases map.
 *
 * @internal
 */
export function resolveVariantRelease(
  variant: Variant,
  releases: Map<string, ReleaseDocument>,
): ReleaseDocument | undefined {
  const releaseRef = variant.document._system.release?._ref
  return variant.releaseDocument ?? (releaseRef ? releases.get(releaseRef) : undefined)
}
