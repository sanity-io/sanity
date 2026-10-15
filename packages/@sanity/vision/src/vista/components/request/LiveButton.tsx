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
  onToggle: () => void
}

/** Turns automatic refetching (through the Live Content API's sync tags) on and off */
export function LiveButton({active, supported, onToggle}: LiveButtonProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const hintId = useId()
  const label = t('vista.live.button')
  let tooltip = t('vista.query.auto-refetch.unsupported')
  if (supported) tooltip = active ? t('vista.live.button.stop') : t('vista.live.button.start')
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
          aria-pressed={unavailable ? undefined : active}
          data-testid="vista-auto-refetch"
          disabled={unavailable}
          gap={2}
          icon={SyncIcon}
          mode={active && supported ? 'default' : 'ghost'}
          onClick={onToggle}
          padding={2}
          text={label}
          tone={active && supported ? 'positive' : 'default'}
        />
        {unavailable && <VisuallyHidden id={hintId}>{tooltip}</VisuallyHidden>}
      </span>
    </Tooltip>
  )
}
