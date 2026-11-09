import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
// oxlint-disable-next-line no-restricted-imports -- the label is an animated node; the studio Button types `text` as a string
import {Button as UIButton, Card, type ButtonProps as UIButtonProps} from '@sanity/ui'
import {clsx} from 'clsx'
import {type MouseEvent, useCallback} from 'react'
import {Text, VStack} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {truncateString} from '../../util/unicodeString'
import {AnimatedTextWidth} from './AnimatedTextWidth'
import {
  perspectiveButtonCard,
  perspectiveButtonCardFullWidth,
  perspectiveButtonClear,
  perspectiveButtonDivider,
  perspectiveButtonTrigger,
  perspectiveButtonTriggerFullWidth,
} from './GlobalPerspectiveButton.css'

/**
 * The longest label the chip shows, in characters. A longer one is cut with an ellipsis, so a long
 * release or variant name does not push the navbar's other controls aside; the tooltip shows it in
 * full.
 */
const LABEL_CHARACTER_LIMIT = 32

/** Same cap as `ReleaseTitle`, so a long release name wraps in the tooltip. */
const FULL_TEXT_TOOLTIP_MAX_WIDTH = '300px'

type GlobalPerspectiveButtonProps = {
  /**
   * Label shown in the chip, cut at `LABEL_CHARACTER_LIMIT`. Its width animates when the label
   * changes.
   */
  text: string
  /**
   * Uncut label, when `text` is already cut. Release titles are truncated to a character limit;
   * this keeps the rest. The trigger shows the uncut label in a tooltip when the chip cuts it.
   */
  fullText?: string
  /**
   * Names the picker, for someone who has not met it yet: the trigger's tooltip shows it, above
   * the uncut label when the chip cuts it.
   */
  tooltip?: string
  /** Icon rendered before the label. */
  icon: UIButtonProps['icon']
  /**
   * Clears a non-default perspective. When omitted, the chip is the default
   * selection and the remove control stays hidden.
   */
  handleClearPerspective?: () => void
  /**
   * Stretches the chip to its parent's width, with the caret at the far edge. The label then
   * truncates with an ellipsis instead of animating its width, which would hold it at its full
   * measured width and clip it.
   */
  fullWidth?: boolean
} & Omit<UIButtonProps, 'children' | 'icon' | 'iconRight' | 'mode' | 'text' | 'width'>

/**
 * Shared chip for the global perspective pickers (releases and variants).
 * A pill trigger with a caret; a clear control sits beside it once a
 * non-default perspective is selected.
 *
 * @internal
 */
export function GlobalPerspectiveButton(props: GlobalPerspectiveButtonProps) {
  const {text, fullText, fullWidth, icon, handleClearPerspective, ref, tooltip, ...buttonProps} =
    props
  const {t} = useTranslation()
  const clearLabel = t('perspective.action.clear')
  const uncutText = fullText ?? text
  // The full-width chip has room to show what fits, and cuts the rest with an ellipsis
  const label = fullWidth ? text : truncateString(uncutText, LABEL_CHARACTER_LIMIT)
  const showFullText = uncutText !== label

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
      className={clsx(perspectiveButtonCard, fullWidth && perspectiveButtonCardFullWidth)}
      data-ui="GlobalPerspectiveButton"
      display="flex"
      flex="none"
      radius="full"
    >
      <Tooltip
        content={
          <VStack gap={2} style={{maxWidth: FULL_TEXT_TOOLTIP_MAX_WIDTH}}>
            {tooltip ? (
              <Text size={1} as="div" trim={true} weight="medium">
                {tooltip}
              </Text>
            ) : null}
            {showFullText ? (
              <Text size={1} as="div" muted={Boolean(tooltip)} trim={true}>
                {uncutText}
              </Text>
            ) : null}
          </VStack>
        }
        portal
        disabled={!tooltip && !showFullText}
      >
        <UIButton
          {...buttonProps}
          aria-label={showFullText ? uncutText : buttonProps['aria-label']}
          className={clsx(perspectiveButtonTrigger, fullWidth && perspectiveButtonTriggerFullWidth)}
          gap={2}
          icon={icon}
          iconRight={ChevronDownIcon}
          justify={fullWidth ? 'flex-start' : undefined}
          mode="bleed"
          padding={2}
          ref={ref}
          radius={0}
          text={fullWidth ? text : <AnimatedTextWidth text={label}>{label}</AnimatedTextWidth>}
        />
      </Tooltip>

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
