import {FilterIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports
import {Button, useClickOutsideEvent} from '@sanity/ui'
import {type ReactNode, useRef, useState} from 'react'

import {Dialog} from '../../../../ui-components/dialog/Dialog'
import {Popover} from '../../../../ui-components/popover/Popover'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
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
    <Tooltip content={t('overview.calendar.tooltip')}>
      <Button
        name="calendar"
        data-as="a"
        icon={FilterIcon}
        mode="bleed"
        padding={2}
        radius="full"
        selected={isCalendarOpen}
        onClick={() => setIsCalendarOpen((prev) => !prev)}
        ref={buttonRef}
        space={2}
      />
    </Tooltip>
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
    <Popover content={content} placement="bottom" open={isCalendarOpen} ref={popoverRef}>
      {triggerButton}
    </Popover>
  )
}
