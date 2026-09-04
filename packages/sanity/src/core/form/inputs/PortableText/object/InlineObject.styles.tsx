import {hues} from '@sanity/color'
import {Card, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps} from 'ui5'

import {
  focusedBorderColorVar,
  focusedFgColorVar,
  hoveredBorderColorVar,
  invalidBgColorVar,
  invalidBorderColorVar,
  invalidHoveredBorderColorVar,
  markersBgColorVar,
  previewSpan,
  radius2Var,
  root,
  selectedBgColorVar,
  tooltipBox,
  warningBgColorVar,
  warningBorderColorVar,
} from './InlineObject.styles.css'

type CardProps = ComponentProps<typeof Card>

export function Root(props: CardProps & {forwardedAs?: CardProps['as']}) {
  const {forwardedAs, className, style, ...rest} = props
  const {color, radius} = useThemeV2()

  return (
    <Card
      {...rest}
      as={forwardedAs}
      className={clsx(root, className)}
      style={{
        ...assignInlineVars({
          [radius2Var]: `${radius[2]}px`,
          [focusedBorderColorVar]: color.selectable.primary.selected.border,
          [focusedFgColorVar]: color.selectable.primary.pressed.fg,
          [selectedBgColorVar]: color.selectable.primary.pressed.bg,
          [hoveredBorderColorVar]: color.input.default.hovered.border,
          [markersBgColorVar]: color._dark ? hues.purple[950].hex : hues.purple[50].hex,
          [warningBgColorVar]: color.button.ghost.caution.hovered.bg,
          [warningBorderColorVar]: color.button.ghost.caution.hovered.border,
          [invalidBgColorVar]: color.input.invalid.enabled.bg,
          [invalidBorderColorVar]: color.input.invalid.enabled.border,
          [invalidHoveredBorderColorVar]: color.input.invalid.hovered.border,
        }),
        ...style,
      }}
    />
  )
}

export function PreviewSpan(props: ComponentProps<'span'>) {
  const {className, ...rest} = props
  return <span {...rest} className={clsx(previewSpan, className)} />
}

type TooltipBoxProps = BoxProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxProps>

export function TooltipBox(props: TooltipBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(tooltipBox, className)} />
}
