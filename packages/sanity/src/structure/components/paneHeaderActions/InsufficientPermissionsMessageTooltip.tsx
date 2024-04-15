import {type ComponentProps, type ReactNode} from 'react'
import {InsufficientPermissionsMessage, useCurrentUser, useTranslation} from 'sanity'

import {Tooltip} from '../../../ui-components'
import {structureLocaleNamespace} from '../../i18n'

interface InsufficientPermissionsMessageTooltipProps {
  reveal: boolean
  /**
   * delegates to `InsufficientPermissionsMessage`'s `context` prop
   * @see InsufficientPermissionsMessage
   */
  context: ComponentProps<typeof InsufficientPermissionsMessage>['context']
  loading: boolean
  children: ReactNode
}

export function InsufficientPermissionsMessageTooltip({
  reveal,
  context,
  loading,
  children,
}: InsufficientPermissionsMessageTooltipProps) {
  const currentUser = useCurrentUser()
  const {t} = useTranslation(structureLocaleNamespace)

  if (!reveal) {
    return <>{children}</>
  }

  return (
    <Tooltip
      content={
        loading ? (
          t('insufficient-permissions-message-tooltip.loading-text')
        ) : (
          <InsufficientPermissionsMessage context={context} currentUser={currentUser} />
        )
      }
      portal
    >
      {/* this wrapping div is to allow mouse events */}
      {/* while the child element is disabled */}
      <div>{children}</div>
    </Tooltip>
  )
}
