import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
// oxlint-disable-next-line no-restricted-imports -- the label is an animated node; the studio Button types `text` as a string
import {Button as UIButton, Card, type ButtonProps as UIButtonProps} from '@sanity/ui'
import {clsx} from 'clsx'
import {type MouseEvent, useCallback} from 'react'
import {Text, Box} from 'ui5'

import {Button} from '../../../ui-components/button/Button'
import {Tooltip} from '../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {
  AnimatedTextWidth,
  AnimatedWidthPill,
  AnimatedWidthSibling,
  useWidthMorphValue,
} from './AnimatedTextWidth'
import {
  perspectiveButtonCard,
  perspectiveButtonCardFullWidth,
  perspectiveButtonClear,
  perspectiveButtonDivider,
  perspectiveButtonEnd,
  perspectiveButtonTrigger,
  perspectiveButtonTriggerFullWidth,
} from './GlobalPerspectiveButton.css'

/** Same cap as `ReleaseTitle`, so a long release name wraps in the tooltip. */
const FULL_TEXT_TOOLTIP_MAX_WIDTH = '300px'

type GlobalPerspectiveButtonProps = {
  /** Label shown in the chip. Its width animates when the label changes. */
  text: string
  /**
   * Uncut label. When it differs from `text`, the trigger shows it in a tooltip.
   * Release titles are truncated to a character limit; this keeps the rest.
   */
  fullText?: string
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
  const {text, fullText, fullWidth, icon, handleClearPerspective, ref, ...buttonProps} = props
  const {t} = useTranslation()
  const clearLabel = t('perspective.action.clear')
  const showFullText = fullText !== undefined && fullText !== text
  // The label beside it changes a transition later, so the clear control appears and goes with it.
  const showClear = useWidthMorphValue(Boolean(handleClearPerspective), fullWidth)

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

  const trigger = (
    <UIButton
      {...buttonProps}
      aria-label={showFullText ? fullText : buttonProps['aria-label']}
      className={clsx(perspectiveButtonTrigger, fullWidth && perspectiveButtonTriggerFullWidth)}
      gap={2}
      icon={icon}
      iconRight={ChevronDownIcon}
      justify={fullWidth ? 'flex-start' : undefined}
      mode="bleed"
      padding={2}
      ref={ref}
      radius={0}
      text={text}
    />
  )

  const clearControl = showClear ? (
    <div className={perspectiveButtonEnd}>
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
    </div>
  ) : null

  const chip = (
    <Card
      border
      className={clsx(perspectiveButtonCard, fullWidth && perspectiveButtonCardFullWidth)}
      data-has-clear={showClear ? '' : undefined}
      data-ui="GlobalPerspectiveButton"
      display="flex"
      flex="none"
      radius="full"
    >
      <Tooltip
        content={
          <Box style={{maxWidth: FULL_TEXT_TOOLTIP_MAX_WIDTH}}>
            <Text size={1} as="div" trim={true}>
              {fullText}
            </Text>
          </Box>
        }
        portal
        disabled={!showFullText}
      >
        {fullWidth ? trigger : <AnimatedTextWidth text={text}>{trigger}</AnimatedTextWidth>}
      </Tooltip>

      {clearControl && !fullWidth ? (
        <AnimatedWidthSibling>{clearControl}</AnimatedWidthSibling>
      ) : (
        clearControl
      )}
    </Card>
  )

  return fullWidth ? chip : <AnimatedWidthPill>{chip}</AnimatedWidthPill>
}
