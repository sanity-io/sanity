import {CalendarIcon} from '@sanity/icons/Calendar'
import {Box, Button, LayerProvider, useClickOutsideEvent, useLayer} from '@sanity/ui'
import {Popover, type PopoverProps} from '@sanity/ui/popover'
import {Tooltip} from '@sanity/ui/tooltip'
import {type KeyboardEvent, type ReactNode, useState} from 'react'
import FocusLock from 'react-focus-lock'
import {
  DatePicker,
  getCalendarLabels,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver/2'
import {useTranslation} from 'sanity/i18n'
import {Flex, Text} from 'ui5'

import {cx} from '../../util/cx'
import * as styles from '../redesign.module.css'
import * as themeStyles from '../themeTokens.module.css'

/** The calendar shows and picks times in the local time zone; nothing stores a choice for it */
const TIME_ZONE_SCOPE = {type: 'input', id: 'vision.params'} as const

/** The params panel sits at the bottom of the tool, so the calendar mostly opens above it */
const FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top']

function toDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || value === '') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function PickerContent(props: {
  popover: HTMLDivElement | null
  onClose: () => void
  children: ReactNode
}) {
  const {popover, onClose, children} = props
  const {isTopLayer} = useLayer()
  useClickOutsideEvent(isTopLayer && onClose, () => [popover])
  return <>{children}</>
}

export interface DateTimePickerButtonProps {
  /** The text input the calendar opens under, and gives focus back to */
  input: HTMLInputElement | null
  value: unknown
  disabled: boolean
  /** Called with the picked date and time as an ISO 8601 string */
  onChange: (value: string) => void
}

/**
 * The calendar button of a date and time param, with the Studio's date-time picker (and its
 * "Set to current time" shortcut) in a popover, like the suffix of the Studio's datetime input.
 * The text input stays editable, so any value can still be typed.
 */
export function DateTimePickerButton(props: DateTimePickerButtonProps) {
  const {input, value, disabled, onChange} = props
  const {t} = useTranslation()
  const labels = getCalendarLabels(t)
  const [open, setOpen] = useState(false)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)
  const close = () => setOpen(false)

  const button = (
    <Tooltip
      animate
      content={
        <Text className={themeStyles.themeTokens} size={1} as="div" trim={true}>
          {labels.tooltipText}
        </Text>
      }
      placement="top"
      portal
    >
      <Button
        aria-label={labels.ariaLabel}
        data-testid="vision-params-form-datetime-picker-button"
        disabled={disabled}
        fontSize={1}
        icon={CalendarIcon}
        mode="bleed"
        onClick={() => setOpen(true)}
        padding={2}
      />
    </Tooltip>
  )

  return (
    <Flex padding={1}>
      {open ? (
        // Rendered only while open, like the Studio's datetime input, so a closed picker keeps
        // nothing mounted
        <LayerProvider zOffset={1000}>
          <Popover
            animate
            className={cx(styles.popoverScroll, themeStyles.themeTokens)}
            constrainSize
            fallbackPlacements={FALLBACK_PLACEMENTS}
            content={
              <PickerContent onClose={close} popover={popover}>
                <Box overflow="auto">
                  <FocusLock
                    onDeactivation={() => {
                      input?.focus()
                      input?.select()
                    }}
                  >
                    <DatePicker
                      calendarLabels={labels}
                      data-testid="vision-params-form-datetime-picker"
                      onChange={(date) => onChange(date.toISOString())}
                      onKeyUp={(event: KeyboardEvent<HTMLDivElement>) => {
                        if (event.key === 'Escape') close()
                      }}
                      selectTime
                      timeZoneScope={TIME_ZONE_SCOPE}
                      value={toDate(value)}
                    />
                  </FocusLock>
                </Box>
              </PickerContent>
            }
            open
            placement="bottom"
            portal
            ref={setPopover}
            referenceElement={input}
          >
            {button}
          </Popover>
        </LayerProvider>
      ) : (
        button
      )}
    </Flex>
  )
}
