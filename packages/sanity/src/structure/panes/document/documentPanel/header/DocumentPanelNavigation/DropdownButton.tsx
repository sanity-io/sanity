import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {type ButtonTone, Card} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type MouseEvent, useCallback} from 'react'
import {truncateString, useTranslation} from 'sanity'

import {Button, type ButtonProps} from '../../../../../../ui-components/button/Button'
import {
  dropdownButtonCard,
  dropdownButtonClear,
  dropdownButtonDivider,
  dropdownButtonTrigger,
} from './DropdownButton.css'

/**
 * The longest label a pill shows, in characters, the same limit as the navbar perspective chips. A
 * longer one is cut with an ellipsis and shown in full in a tooltip.
 */
const LABEL_CHARACTER_LIMIT = 32

/** @internal */
export type DropdownButtonProps = Omit<
  ComponentProps<typeof Button>,
  'icon' | 'iconRight' | 'mode' | 'text' | 'tone' | 'tooltipProps'
> & {
  /** Label of the trigger. */
  text: string
  /** Icon rendered before the label. */
  icon: ButtonProps['icon']
  /**
   * Tone of the pill while something other than the default option is selected. Both halves then
   * take the tone's selected colours, the same fill, text and icon colours as a selected version
   * chip (Published, Draft), so every selected pill in the header follows one rule.
   */
  tone?: ButtonTone
  /**
   * Clears the selection. When set, the pill is in its selected state and the remove control
   * shows beside the trigger.
   */
  onClear?: () => void
}

/**
 * Pill trigger for the document panel navigation menus: a label with a caret, and a remove
 * control once something other than the default option is selected. Pass it as a `MenuButton`
 * `button`; the remaining props and `ref` go to the trigger.
 *
 * @internal
 */
export function DropdownButton(props: DropdownButtonProps) {
  const {className, icon, onClear, ref, text, tone = 'default', ...triggerProps} = props
  const {t} = useTranslation()
  const clearLabel = t('perspective.action.clear')
  const hasSelection = onClear !== undefined
  const label = truncateString(text, LABEL_CHARACTER_LIMIT)
  const isCut = label !== text

  const handleClearMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }, [])

  const handleClear = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      onClear?.()
    },
    [onClear],
  )

  return (
    <Card
      className={dropdownButtonCard}
      data-selected={hasSelection ? '' : undefined}
      data-ui="DropdownButton"
      display="flex"
      flex="none"
      radius="full"
    >
      <Button
        {...triggerProps}
        className={clsx(dropdownButtonTrigger, className)}
        // The v4 button does not expose its tone; this keeps it readable in tests and devtools
        data-tone={hasSelection ? tone : 'default'}
        icon={icon}
        iconRight={ChevronDownIcon}
        mode="ghost"
        aria-label={isCut ? text : triggerProps['aria-label']}
        ref={ref}
        selected={hasSelection}
        text={label}
        tooltipProps={isCut ? {content: text, placement: 'bottom', portal: true} : undefined}
        tone={hasSelection ? tone : 'default'}
      />
      {hasSelection ? (
        <>
          <Button
            aria-label={clearLabel}
            className={dropdownButtonClear}
            data-testid="dropdown-button-clear"
            icon={CloseIcon}
            mode="ghost"
            onClick={handleClear}
            onMouseDown={handleClearMouseDown}
            selected
            tone={tone}
            tooltipProps={{content: clearLabel}}
          />
        </>
      ) : null}
    </Card>
  )
}
