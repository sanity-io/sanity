import {hues} from '@sanity/color'
import {Flex, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {rgba} from '@sanity/ui/theme'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps} from 'ui5'

import {TEXT_LEVELS} from './constants'
import {
  blendModeVar,
  blockActionsInner,
  blockActionsOuter,
  blockActionsTopVar,
  changeIndicatorWrapper,
  changeIndicatorWrapperHidden,
  errorBgColorVar,
  errorBorderColorVar,
  fontFamilyVar,
  listPaddingLeftVar,
  listPrefixWrapper,
  markersBgColorVar,
  radius2Var,
  selectionBgColorVar,
  space1Var,
  space2Var,
  textBlockWrapper,
  textFlex,
  textRoot,
  textRootLevel,
  tooltipBox,
  warningBgColorVar,
  warningBorderColorVar,
} from './TextBlock.styles.css'

interface TextBlockStyleProps {
  $level: number
}

export function TextRoot(props: ComponentProps<'div'> & TextBlockStyleProps) {
  const {$level, className, style, ...rest} = props
  const {color, font, radius, space} = useThemeV2()
  // The editor clamps list levels to `TEXT_LEVELS`; anything else falls back to the first level
  const level = TEXT_LEVELS.includes($level) ? $level : TEXT_LEVELS[0]

  return (
    <div
      {...rest}
      className={clsx(textRoot, textRootLevel[level], className)}
      style={{
        ...assignInlineVars({
          [space1Var]: `${space[1]}px`,
          [radius2Var]: `${radius[2]}px`,
          [blendModeVar]: color._dark ? 'screen' : 'multiply',
          [markersBgColorVar]: color._dark ? hues.purple[950].hex : hues.purple[50].hex,
          [warningBorderColorVar]: color.button.ghost.caution.enabled.border,
          [warningBgColorVar]: color.button.ghost.caution.hovered.bg,
          [errorBorderColorVar]: color.button.ghost.critical.enabled.border,
          [errorBgColorVar]: color.button.ghost.critical.hovered.bg,
          [fontFamilyVar]: font.text.family,
          [selectionBgColorVar]: rgba(color.focusRing, 0.3),
        }),
        ...style,
      }}
    />
  )
}

type DivBoxProps = BoxProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxProps>

export function TextBlockWrapper(props: DivBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(textBlockWrapper, className)} />
}

export function ListPrefixWrapper(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(listPrefixWrapper, className)} />
}

export function BlockActionsOuter(props: DivBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(blockActionsOuter, className)} />
}

export function BlockActionsInner(props: ComponentProps<typeof Flex>) {
  const {className, style, ...rest} = props
  const {font, space} = useThemeV2()
  const textSize1 = font.text.sizes[1]
  const textSize2 = font.text.sizes[2]
  const capHeight1 = textSize1.lineHeight - textSize1.ascenderHeight - textSize1.descenderHeight
  const capHeight2 = textSize2.lineHeight - textSize2.ascenderHeight - textSize2.descenderHeight
  const buttonHeight = capHeight1 + space[2] + space[2]

  // This calculates the following:
  // > var buttonHeight = 25px
  // > var capHeight2 = 11px
  // > 0 - (buttonHeight - capHeight2) / 2 = -7px
  const negativeTop = 0 - (buttonHeight - capHeight2) / 2

  return (
    <Flex
      {...rest}
      className={clsx(blockActionsInner, className)}
      style={{...assignInlineVars({[blockActionsTopVar]: `${negativeTop}px`}), ...style}}
    />
  )
}

export function TooltipBox(props: DivBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(tooltipBox, className)} />
}

export function TextFlex(props: ComponentProps<typeof Flex> & {$level?: number}) {
  const {$level, className, style, ...rest} = props

  return (
    <Flex
      {...rest}
      className={clsx(textFlex, className)}
      style={{
        ...assignInlineVars({[listPaddingLeftVar]: `${$level ? $level * 32 : 0}px`}),
        ...style,
      }}
    />
  )
}

export function ChangeIndicatorWrapper(props: ComponentProps<'div'> & {$hasChanges: boolean}) {
  const {$hasChanges, className, style, ...rest} = props
  const {space} = useThemeV2()

  return (
    <div
      {...rest}
      className={clsx(
        changeIndicatorWrapper,
        !$hasChanges && changeIndicatorWrapperHidden,
        className,
      )}
      style={{
        ...assignInlineVars({
          [space1Var]: `${space[1]}px`,
          [space2Var]: `${space[2]}px`,
        }),
        ...style,
      }}
    />
  )
}
