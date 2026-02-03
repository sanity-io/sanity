import {CalendarIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports
import {Button, useClickOutsideEvent} from '@sanity/ui'
import {type ReactNode, useRef, useState} from 'react'

import {Popover} from '../../../../ui-components/popover/Popover'
import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {releasesLocaleNamespace} from '../../i18n'

export function CalendarPopover({content}: {content: ReactNode}) {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const {t} = useTranslation(releasesLocaleNamespace)

  useClickOutsideEvent(
    () => setIsCalendarOpen(false),
    () => [buttonRef.current, popoverRef.current],
  )

  return (
    <Popover content={content} placement="bottom" open={isCalendarOpen} ref={popoverRef}>
      <Tooltip content={t('overview.calendar.tooltip')}>
        <Button
          name="calendar"
          data-as="a"
          icon={CalendarIcon}
          mode="bleed"
          padding={2}
          radius="full"
          selected={isCalendarOpen}
          onClick={() => setIsCalendarOpen((prev) => !prev)}
          ref={buttonRef}
          space={2}
        />
      </Tooltip>
    </Popover>
  )
}
