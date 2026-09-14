import {type Path} from '@sanity/types'
import {rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ElementType, type HTMLProps, type ReactNode, useMemo} from 'react'

import {type Annotation, type Diff} from '../../types'
import {getAnnotationAtPath} from '../annotations/helpers'
import {useAnnotationColor} from '../annotations/hooks'
import {diffCard, diffCardBgColorVar, diffCardFgColorVar, diffCardRadiusVar} from './DiffCard.css'
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
export function DiffCard(props: DiffCardProps & Omit<HTMLProps<HTMLElement>, 'as' | 'height'>) {
  const {
    ref,
    annotation: annotationProp,
    as: Component = 'div',
    children,
    className,
    diff,
    disableHoverEffect,
    path = EMPTY_PATH,
    style = {},
    tooltip,
    ...restProps
  } = props
  const {radius} = useThemeV2()

  const annotation = useMemo(
    () => annotationProp || getAnnotationAtPath(diff!, path),
    [annotationProp, diff, path],
  )

  const color = useAnnotationColor(annotation)

  const element = (
    <Component
      {...restProps}
      className={clsx(diffCard, className)}
      data-hover={disableHoverEffect || !annotation ? undefined : ''}
      data-ui="diff-card"
      ref={ref}
      // Added annotation color to the card using css to make it possible to override by the ReleaseReview
      style={{
        ...assignInlineVars({
          [diffCardRadiusVar]: `${rem(radius[2])}`,
          [diffCardBgColorVar]: color.background,
          [diffCardFgColorVar]: color.text,
        }),
        ...style,
      }}
    >
      {children}
    </Component>
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
}
