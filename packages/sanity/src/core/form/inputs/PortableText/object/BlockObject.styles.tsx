import {hues} from '@sanity/color'
import {Card, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps, Flex} from 'ui5'

import {
  blockActionsInner,
  blockActionsOuter,
  changeIndicatorWrapper,
  changeIndicatorWrapperHidden,
  hoveredBorderColorVar,
  invalidBgColorVar,
  invalidBorderColorVar,
  markersBgColorVar,
  overlayBlendModeVar,
  previewContainer,
  radius1Var,
  radius2Var,
  root,
  space1Var,
  space2Var,
  tooltipBox,
  warningBgColorVar,
  warningBorderColorVar,
} from './BlockObject.styles.css'

export function Root(props: ComponentProps<typeof Card>) {
  const {className, style, ...rest} = props
  const {color, radius, space} = useThemeV2()

  return (
    <Card
      {...rest}
      className={clsx(root, className)}
      style={{
        ...assignInlineVars({
          [space1Var]: `${space[1]}px`,
          [radius1Var]: `${radius[1]}px`,
          [radius2Var]: `${radius[2]}px`,
          [overlayBlendModeVar]: color._dark ? 'screen' : 'multiply',
          [markersBgColorVar]: color._dark ? hues.purple[950].hex : hues.purple[50].hex,
          [warningBgColorVar]: color.button.ghost.caution.hovered.bg,
          [warningBorderColorVar]: color.button.ghost.caution.hovered.border,
          [invalidBgColorVar]: color.input.invalid.enabled.bg,
          [invalidBorderColorVar]: color.input.invalid.hovered.border,
          [hoveredBorderColorVar]: color.input.default.hovered.border,
        }),
        ...style,
      }}
    />
  )
}

export function PreviewContainer(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(previewContainer, className)} />
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

type DivBoxProps = BoxProps & Omit<ComponentPropsWithRef<'div'>, keyof BoxProps>

export function BlockActionsOuter(props: DivBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(blockActionsOuter, className)} />
}

export function BlockActionsInner(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props
  return <Flex {...rest} className={clsx(blockActionsInner, className)} />
}

export function TooltipBox(props: DivBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} className={clsx(tooltipBox, className)} />
}
