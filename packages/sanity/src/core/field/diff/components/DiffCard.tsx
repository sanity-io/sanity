import {type Path} from '@sanity/types'
import {Card, rem} from '@sanity/ui'
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ElementType, forwardRef, type HTMLProps, type ReactNode, useMemo} from 'react'

import {type Annotation, type Diff} from '../../types'
import {getAnnotationAtPath, useAnnotationColor} from '../annotations'
import {bgColorVar, diffCardBgColorVar, diffCardRadiusVar, styledCard, textColorVar} from './DiffCard.css'
import {DiffTooltip} from './DiffTooltip'

/** @internal */
export interface DiffCardProps {
  annotation?: Annotation
  as?: ElementType | keyof React.JSX.IntrinsicElements
  diff?: Diff
  disableHoverEffect?: boolean
  path?: Path | string
  tooltip?: {description?: ReactNode} | boolean
}

const EMPTY_PATH: Path = []

/** @internal */
export const DiffCard = forwardRef(function DiffCard(
  props: DiffCardProps & Omit<HTMLProps<HTMLElement>, 'as' | 'height'>,
  ref,
) {
  const {
    annotation: annotationProp,
    as = 'div',
    children,
    className,
    diff,
    disableHoverEffect,
    path = EMPTY_PATH,
    style = {},
    tooltip,
    ...restProps
  } = props

  const annotation = useMemo(
    () => annotationProp || getAnnotationAtPath(diff!, path),
    [annotationProp, diff, path],
  )

  const color = useAnnotationColor(annotation)
  const {radius, color: themeColor} = useThemeV2()

  const inlineVars = useMemo(
    () =>
      assignInlineVars({
        [bgColorVar]: color.background,
        [textColorVar]: color.text,
        [diffCardRadiusVar]: rem(radius[2]),
        [diffCardBgColorVar]: themeColor.card.enabled.bg,
      }),
    [color.background, color.text, radius, themeColor.card.enabled.bg],
  )

  const mergedStyle = useMemo(() => ({...inlineVars, ...style}), [inlineVars, style])

  const element = (
    <Card
      {...restProps}
      as={as}
      className={className ? `${styledCard} ${className}` : styledCard}
      data-hover={disableHoverEffect || !annotation ? undefined : ''}
      data-ui="diff-card"
      ref={ref}
      radius={1}
      // Added annotation color to the card using css to make it possible to override by the ReleaseReview
      style={mergedStyle}
    >
      {children}
    </Card>
  )

  if (tooltip && annotation) {
    return (
      <DiffTooltip
        annotations={[annotation]}
        description={tooltip && typeof tooltip === 'object' && tooltip.description}
      >
        {element}
      </DiffTooltip>
    )
  }

  return element
})
