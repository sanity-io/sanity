import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'

import {
  cropDimensionsBadgeGroup,
  cropDimensionsBadgeGroupVisibility,
  cropDimensionsBadgeRect,
  cropDimensionsBadgeText,
  cropRect,
  cropRectFocused,
  cropRectHovered,
  darkenedOverlay,
  fontTextFamilyVar,
  fontTextSize0FontSizeVar,
  fontTextSize0LetterSpacingVar,
  fontTextWeightMediumVar,
  guidelines,
  handle,
  handleFocused,
  hotspotEllipse,
  hotspotEllipseFocused,
  hotspotEllipseHovered,
  interactionArea,
  radius1Var,
  styledSVG,
  svgContainer,
} from './ToolSVG.css'

export function SVGContainer(props: ComponentProps<'div'>) {
  const {className, ...rest} = props
  return <div {...rest} className={clsx(svgContainer, className)} />
}

export function StyledSVG(props: ComponentProps<'svg'>) {
  const {className, ...rest} = props
  return <svg {...rest} className={clsx(styledSVG, className)} />
}

export function DarkenedOverlay(props: ComponentProps<'rect'>) {
  const {className, ...rest} = props
  return <rect {...rest} className={clsx(darkenedOverlay, className)} />
}

export interface StyledElementProps {
  $focused?: boolean
  $hovered?: boolean
}

export function CropRect(props: ComponentProps<'rect'> & StyledElementProps) {
  const {$focused, $hovered, className, ...rest} = props
  return (
    <rect
      {...rest}
      className={clsx(
        cropRect,
        $hovered && cropRectHovered,
        $focused && cropRectFocused,
        className,
      )}
    />
  )
}

// The handles only react to `$focused`; `$hovered` is accepted for prop-API parity and dropped
// so it never reaches the DOM.

export function CropCornerHandle(props: ComponentProps<'path'> & StyledElementProps) {
  const {$focused, $hovered: _hovered, className, ...rest} = props
  return <path {...rest} className={clsx(handle, $focused && handleFocused, className)} />
}

export function CropEdgeHandle(props: ComponentProps<'rect'> & StyledElementProps) {
  const {$focused, $hovered: _hovered, className, ...rest} = props
  return <rect {...rest} className={clsx(handle, $focused && handleFocused, className)} />
}

export function HotspotEllipse(props: ComponentProps<'ellipse'> & StyledElementProps) {
  const {$focused, $hovered, className, ...rest} = props
  return (
    <ellipse
      {...rest}
      className={clsx(
        hotspotEllipse,
        $hovered && hotspotEllipseHovered,
        $focused && hotspotEllipseFocused,
        className,
      )}
    />
  )
}

export function HotspotHandle(props: ComponentProps<'circle'> & StyledElementProps) {
  const {$focused, $hovered: _hovered, className, ...rest} = props
  return <circle {...rest} className={clsx(handle, $focused && handleFocused, className)} />
}

export function CropHandleInteractionArea(props: ComponentProps<'rect'> & StyledElementProps) {
  const {$focused: _focused, $hovered: _hovered, className, ...rest} = props
  return <rect {...rest} className={clsx(interactionArea, className)} />
}

export function HotspotHandleInteractionArea(props: ComponentProps<'circle'>) {
  const {className, ...rest} = props
  return <circle {...rest} className={clsx(interactionArea, className)} />
}

export function Guidelines(props: ComponentProps<'g'>) {
  const {className, ...rest} = props
  return <g {...rest} className={clsx(guidelines, className)} />
}

export function CropDimensionsBadgeGroup(props: ComponentProps<'g'> & {$visible: boolean}) {
  const {$visible, className, ...rest} = props
  return (
    <g
      {...rest}
      className={clsx(
        cropDimensionsBadgeGroup,
        cropDimensionsBadgeGroupVisibility[$visible ? 'visible' : 'hidden'],
        className,
      )}
    />
  )
}

export function CropDimensionsBadgeRect(props: ComponentProps<'rect'>) {
  const {className, style, ...rest} = props
  const {radius} = useThemeV2()
  return (
    <rect
      {...rest}
      className={clsx(cropDimensionsBadgeRect, className)}
      style={{...assignInlineVars({[radius1Var]: `${radius[1]}px`}), ...style}}
    />
  )
}

export function CropDimensionsBadgeText(props: ComponentProps<'text'>) {
  const {className, style, ...rest} = props
  const {font} = useThemeV2()
  const textSize = font.text.sizes[0]
  return (
    <text
      {...rest}
      className={clsx(cropDimensionsBadgeText, className)}
      style={{
        ...assignInlineVars({
          [fontTextFamilyVar]: font.text.family,
          [fontTextSize0FontSizeVar]: `${textSize.fontSize}px`,
          [fontTextSize0LetterSpacingVar]: `${textSize.letterSpacing}px`,
          [fontTextWeightMediumVar]: String(font.text.weights.medium),
        }),
        ...style,
      }}
    />
  )
}
