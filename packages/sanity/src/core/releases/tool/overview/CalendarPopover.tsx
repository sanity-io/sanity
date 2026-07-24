import {CalendarIcon} from '@sanity/icons/Calendar'
import {useClickOutsideEvent} from '@sanity/ui'
import {type ReactNode, useRef, useState} from 'react'

import {Button} from '../../../../ui-components/button/Button'
import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {Popover} from '../../../../ui-components/popover/Popover'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'

export function CalendarPopover({content, asDialog}: {content: ReactNode; asDialog?: boolean}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const {t} = useTranslation(releasesLocaleNamespace)

  useClickOutsideEvent(
    () => {
      if (!asDialog) setIsCalendarOpen(false)
    },
    () => [buttonRef.current, popoverRef.current],
  )

  const triggerButton = (
    <Button
      icon={CalendarIcon}
      mode="bleed"
      radius="full"
      selected={isCalendarOpen}
      onClick={() => setIsCalendarOpen((prev) => !prev)}
      ref={buttonRef}
      aria-label={t('overview.calendar.tooltip')}
      tooltipProps={{content: t('overview.calendar.tooltip')}}
    />
  )

  if (asDialog) {
    return (
      <>
        {triggerButton}
        {isCalendarOpen && (
          <Dialog
            id="calendar-filter-dialog"
            header={t('overview.calendar.tooltip')}
            onClose={() => setIsCalendarOpen(false)}
            onClickOutside={() => setIsCalendarOpen(false)}
            width={1}
            padding={false}
          >
            {content}
          </Dialog>
        )}
      </>
    )
  }

  return (
    <Popover
      content={content}
      placement="bottom-end"
      fallbackPlacements={['bottom-start', 'top-end', 'top-start']}
      constrainSize
      open={isCalendarOpen}
      portal
      ref={popoverRef}
    >
      {triggerButton}
    </Popover>
  )
}
