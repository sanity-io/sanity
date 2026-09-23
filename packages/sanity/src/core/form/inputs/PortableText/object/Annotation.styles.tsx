import {hues} from '@sanity/color'
import {type ThemeColorToneKey, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps, type ComponentPropsWithRef} from 'react'
import {Box, type BoxProps} from 'ui5'

import {
  bgColorVar,
  customMarkersBgColorVar,
  errorBgColorVar,
  fgColorVar,
  root,
  tooltipBox,
  warningBgColorVar,
} from './Annotation.styles.css'

export function Root(
  props: ComponentProps<'span'> & {
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    $toneKey?: Exclude<ThemeColorToneKey, 'transparent'>
  },
) {
  const {$toneKey = 'default', className, style, ...rest} = props
  const {color} = useThemeV2()

  return (
    <span
      {...rest}
      className={clsx(root, className)}
      style={{
        ...assignInlineVars({
          [bgColorVar]: color.selectable[$toneKey].enabled.bg,
          [fgColorVar]: color.selectable[$toneKey].enabled.fg,
          [customMarkersBgColorVar]: color._dark ? hues.purple[950].hex : hues.purple[50].hex,
          [warningBgColorVar]: color.button.ghost.caution.hovered.bg,
          [errorBgColorVar]: color.button.ghost.critical.hovered.bg,
        }),
        ...style,
      }}
    />
  )
}

type TooltipBoxProps = BoxProps<'span'> &
  Omit<ComponentPropsWithRef<'span'>, keyof BoxProps<'span'>>

export function TooltipBox(props: TooltipBoxProps) {
  const {className, ...rest} = props
  return <Box {...rest} as="span" className={clsx(tooltipBox, className)} />
}
