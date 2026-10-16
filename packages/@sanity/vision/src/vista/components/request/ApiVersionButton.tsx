import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'
import {usePerspectiveOptionName} from './OptionFields'

/** The fields of the Options panel the button can show */
export type RevealedOption = 'apiVersion' | 'perspective'

export interface ApiVersionButtonProps {
  resolved: Pick<
    ResolvedRequest,
    | 'apiVersion'
    | 'isValidApiVersion'
    | 'isApiVersionLocked'
    | 'useCdn'
    | 'isCdnBlockedByPerspective'
    | 'tabPerspective'
  >
  /** Shows a field in the Options panel */
  onReveal: (option: RevealedOption) => void
}

/**
 * The API version the tab's requests go out with, and whether they go to the API CDN, next to
 * Fetch, so it is in view while the Options panel is collapsed or scrolled away. Pressing it
 * shows the field that changes it: the perspective while it keeps the queries off the CDN.
 */
export function ApiVersionButton({resolved, onReveal}: ApiVersionButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const {apiVersion, isValidApiVersion, isApiVersionLocked, useCdn, isCdnBlockedByPerspective} =
    resolved
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)
  const cdnBlocked = isValidApiVersion && isCdnBlockedByPerspective
  let tooltip = useCdn
    ? t('vista.api-version.tooltip-cdn', {version: apiVersion})
    : t('vista.api-version.tooltip', {version: apiVersion})
  if (!isValidApiVersion) tooltip = t('vista.api-version.tooltip-invalid')
  else if (cdnBlocked) {
    tooltip = t('vista.api-version.tooltip-cdn-blocked', {
      version: apiVersion,
      perspective: perspectiveName,
    })
  } else if (isApiVersionLocked) {
    tooltip = t('vista.api-version.tooltip-locked', {version: apiVersion})
  }

  return (
    <Tooltip animate content={<Text size={1}>{tooltip}</Text>} placement="top" portal>
      <Button
        data-cdn-blocked={cdnBlocked || undefined}
        data-testid="vista-api-version-button"
        fontSize={1}
        icon={cdnBlocked ? WarningOutlineIcon : undefined}
        mode="bleed"
        onClick={() => onReveal(cdnBlocked ? 'perspective' : 'apiVersion')}
        padding={2}
        text={
          isValidApiVersion
            ? t(useCdn ? 'vista.api-version.button-cdn' : 'vista.api-version.button', {
                version: apiVersion,
              })
            : t('vista.api-version.button-invalid')
        }
        tone={isValidApiVersion && !cdnBlocked ? 'default' : 'caution'}
      />
    </Tooltip>
  )
}
