import {StopIcon} from '@sanity/icons/Stop'
import {SyncIcon} from '@sanity/icons/Sync'
import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useId} from 'react'
import {useTranslation} from 'sanity'
import {VisuallyHidden} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'

export interface LiveButtonProps {
  /** The tab refetches automatically */
  active: boolean
  /** The tab's API version has sync tags, which automatic refetching follows */
  supported: boolean
  /** There is a request to fetch, as for the Fetch button */
  canFetch: boolean
  onToggle: () => void
}

/**
 * Live fetch, an alternative to Fetch: fetches the query, then fetches again whenever the
 * documents in the result change (through the Live Content API's sync tags), until Stop live
 */
export function LiveButton({active, supported, canFetch, onToggle}: LiveButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const hintId = useId()
  const live = active && supported
  const label = live ? t('vista.live.stop') : t('vista.live.button')
  let tooltip = t('vista.query.auto-refetch.unsupported')
  if (supported) tooltip = live ? t('vista.live.button.stop') : t('vista.live.button.start')
  const unavailable = !supported

  return (
    <Tooltip animate content={<Text size={1}>{tooltip}</Text>} placement="top" portal>
      {/*
        A disabled button gets neither pointer events nor focus, so while the API version has no
        sync tags the wrapper stands in for it, as a disabled button described by the reason
      */}
      <span
        aria-describedby={unavailable ? hintId : undefined}
        aria-disabled={unavailable || undefined}
        aria-label={unavailable ? label : undefined}
        role={unavailable ? 'button' : undefined}
        tabIndex={unavailable ? 0 : undefined}
      >
        <Button
          aria-hidden={unavailable || undefined}
          data-testid="vista-auto-refetch"
          // Like Fetch it needs something to fetch, but a running session can always be stopped
          disabled={unavailable || (!live && !canFetch)}
          gap={2}
          icon={live ? StopIcon : SyncIcon}
          mode={live ? 'default' : 'ghost'}
          onClick={onToggle}
          padding={2}
          text={label}
          tone={live ? 'positive' : 'default'}
        />
        {unavailable && <VisuallyHidden id={hintId}>{tooltip}</VisuallyHidden>}
      </span>
    </Tooltip>
  )
}
