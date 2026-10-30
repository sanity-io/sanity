import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
// oxlint-disable-next-line no-restricted-imports -- the label is an animated node; the studio Button types `text` as a string
import {Button as UIButton, Card, type ButtonProps as UIButtonProps} from '@sanity/ui'
import {type MouseEvent, useCallback} from 'react'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {AnimatedTextWidth} from './AnimatedTextWidth'
import {
  perspectiveButtonCard,
  perspectiveButtonClear,
  perspectiveButtonDivider,
  perspectiveButtonTrigger,
} from './GlobalPerspectiveButton.css'

type GlobalPerspectiveButtonProps = {
  /** Label shown in the chip. Its width animates when the label changes. */
  text: string
  /** Icon rendered before the label. */
  icon: UIButtonProps['icon']
  /**
   * Clears a non-default perspective. When omitted, the chip is the default
   * selection and the remove control stays hidden.
   */
  handleClearPerspective?: () => void
} & Omit<UIButtonProps, 'children' | 'icon' | 'iconRight' | 'mode' | 'text'>

/**
 * Shared chip for the global perspective pickers (releases and variants).
 * A pill trigger with a caret; a clear control sits beside it once a
 * non-default perspective is selected.
 *
 * @internal
 */
export function GlobalPerspectiveButton(props: GlobalPerspectiveButtonProps) {
  const {text, icon, handleClearPerspective, ref, ...buttonProps} = props
  const {t} = useTranslation()
  const clearLabel = t('perspective.action.clear')

  const handleClearMouseDown = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
  }, [])

  const handleClear = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      handleClearPerspective?.()
    },
    [handleClearPerspective],
  )

  return (
    <Card
      border
      className={perspectiveButtonCard}
      data-ui="GlobalPerspectiveButton"
      display="flex"
      flex="none"
      radius="full"
    >
      <UIButton
        {...buttonProps}
        className={perspectiveButtonTrigger}
        gap={2}
        icon={icon}
        iconRight={ChevronDownIcon}
        mode="bleed"
        padding={2}
        ref={ref}
        radius={0}
        text={<AnimatedTextWidth text={text}>{text}</AnimatedTextWidth>}
      />
      {handleClearPerspective ? (
        <>
          <div aria-hidden className={perspectiveButtonDivider} />
          <Button
            aria-label={clearLabel}
            className={perspectiveButtonClear}
            data-testid="global-perspective-button-clear"
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
