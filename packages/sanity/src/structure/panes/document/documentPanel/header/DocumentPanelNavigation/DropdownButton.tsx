import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {Card, type CardTone} from '@sanity/ui'
import {clsx} from 'clsx'
import {type ComponentProps, type MouseEvent, useCallback} from 'react'
import {useTranslation} from 'sanity'

import {Button, type ButtonProps} from '../../../../../../ui-components/button/Button'
import {
  dropdownButtonCard,
  dropdownButtonClear,
  dropdownButtonDivider,
  dropdownButtonTrigger,
} from './DropdownButton.css'

/** @internal */
export type DropdownButtonProps = Omit<
  ComponentProps<typeof Button>,
  'icon' | 'iconRight' | 'mode' | 'text' | 'tone' | 'tooltipProps'
> & {
  /** Label of the trigger. */
  text: string
  /** Icon rendered before the label. */
  icon: ButtonProps['icon']
  /** Tone of the pill while something other than the default option is selected. */
  tone?: CardTone
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
      border={hasSelection}
      className={dropdownButtonCard}
      data-selected={hasSelection ? '' : undefined}
      data-ui="DropdownButton"
      display="flex"
      flex="none"
      radius="full"
      tone={hasSelection ? tone : 'default'}
    >
      <Button
        {...triggerProps}
        className={clsx(dropdownButtonTrigger, className)}
        icon={icon}
        iconRight={ChevronDownIcon}
        mode={hasSelection ? 'bleed' : 'ghost'}
        ref={ref}
        text={text}
      />
      {hasSelection ? (
        <>
          <div aria-hidden className={dropdownButtonDivider} />
          <Button
            aria-label={clearLabel}
            className={dropdownButtonClear}
            data-testid="dropdown-button-clear"
            icon={CloseIcon}
            mode="bleed"
            onClick={handleClear}
            onMouseDown={handleClearMouseDown}
            tooltipProps={{content: clearLabel}}
          />
        </>
      ) : null}
    </Card>
  )
}
