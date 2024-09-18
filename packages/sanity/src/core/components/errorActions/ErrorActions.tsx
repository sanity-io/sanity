import {CopyIcon, SyncIcon} from '@sanity/icons'
import {Inline} from '@sanity/ui'
import {type ComponentProps, type ComponentType} from 'react'

import {Button, Tooltip} from '../../../ui-components'
import {strings} from './strings'
import {useCopyErrorDetails} from './useCopyErrorDetails'

/**
 * @internal
 */
export interface ErrorActionsProps extends Pick<ComponentProps<typeof Button>, 'size'> {
  error: unknown
  eventId: string | null
  onRetry?: () => void
}

/**
 * @internal
 */
export const ErrorActions: ComponentType<ErrorActionsProps> = ({error, eventId, onRetry, size}) => {
  const copyErrorDetails = useCopyErrorDetails(error, eventId)

  return (
    <Inline space={3}>
      {onRetry && (
        <Button
          onClick={onRetry}
          text={strings['retry.title']}
          tone="primary"
          icon={SyncIcon}
          size={size}
        />
      )}
      <Tooltip content={strings['copy-error-details.description']}>
        <Button
          onClick={copyErrorDetails}
          text={strings['copy-error-details.title']}
          tone="default"
          mode="ghost"
          icon={CopyIcon}
          size={size}
        />
      </Tooltip>
    </Inline>
  )
}
