import {type ReleaseDocument} from '@sanity/client'
import {type MouseEventHandler, type ReactNode, type Ref} from 'react'
import {Text} from 'ui5'

import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../i18n/localeNamespaces'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {type Variant} from '../machines/selectionMachine'
import {type ServedStatus} from '../utils/resolveServedVersion'
import {StatusBadge} from './VariantSet/StatusBadge'
import {VariantSetEntry} from './VariantSet/VariantSetEntry'

/**
 * Shared row chrome for a document group version.
 *
 * @internal
 */
export function DocumentGroupEntry({
  variant,
  releases,
  isSelected,
  servedStatus,
  leading,
  onPrimaryAction,
  onContextMenu,
  primaryActionRef,
}: {
  variant: Variant
  releases: Map<string, ReleaseDocument>
  isSelected?: boolean
  servedStatus?: ServedStatus
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
    <VariantSetEntry
      data-variant-name={variant.name}
      data-selected={isSelected || undefined}
      data-served={servedStatus}
    >
      <div className="atom">{leading}</div>
      <div className="atom">
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
          <Text size={1} weight="medium" trim={true}>
            {variant.name}
          </Text>
        </div>
        <div className="atom">
          {isSelected && (
            <StatusBadge radius={2} tone="primary">
              {t('document-group-inventory.viewing-item-label')}
            </StatusBadge>
          )}
          {servedStatus && (
            <Tooltip content={t('document-group.version.served.tooltip')}>
              <StatusBadge radius={2} tone={servedStatus === 'primary' ? 'positive' : 'suggest'}>
                {servedStatus === 'primary'
                  ? t('document-group.version.served')
                  : t('document-group.version.served-instead')}
              </StatusBadge>
            </Tooltip>
          )}
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
        </div>
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
