import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest} from '../../hooks/useResolvedRequest'

export interface ApiVersionButtonProps {
  resolved: Pick<ResolvedRequest, 'apiVersion' | 'isValidApiVersion' | 'isApiVersionLocked'>
  /** Shows the API version field in the Options panel */
  onReveal: () => void
}

/**
 * The API version the tab's requests go out with, next to Fetch, so it is in view while the
 * Options panel is collapsed or scrolled away. Pressing it shows the field that changes it.
 */
export function ApiVersionButton({resolved, onReveal}: ApiVersionButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const {apiVersion, isValidApiVersion, isApiVersionLocked} = resolved
  let tooltip = t('vista.api-version.tooltip', {version: apiVersion})
  if (!isValidApiVersion) tooltip = t('vista.api-version.tooltip-invalid')
  else if (isApiVersionLocked)
    tooltip = t('vista.api-version.tooltip-locked', {version: apiVersion})

  return (
    <Tooltip animate content={<Text size={1}>{tooltip}</Text>} placement="top" portal>
      <Button
        data-testid="vista-api-version-button"
        fontSize={1}
        mode="bleed"
        onClick={onReveal}
        padding={2}
        text={
          isValidApiVersion
            ? t('vista.api-version.button', {version: apiVersion})
            : t('vista.api-version.button-invalid')
        }
        tone={isValidApiVersion ? 'default' : 'caution'}
      />
    </Tooltip>
  )
}
