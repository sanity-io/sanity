import {type Path} from '@sanity/types'
import {Card, rem} from '@sanity/ui'
import {type ElementType, forwardRef, type HTMLProps, type ReactNode, useMemo} from 'react'
import {styled} from 'styled-components'

import {type Annotation, type Diff} from '../../types'
import {getAnnotationAtPath, useAnnotationColor} from '../annotations'
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

interface StyledCardProps {
  $annotationColor: {backgroundColor: string; color: string}
}

const StyledCard = styled(Card)<StyledCardProps>`
  --diff-card-radius: ${({theme}) => rem(theme.sanity.radius[2])};
  --diff-card-bg-color: ${({theme}) => theme.sanity.color.card.enabled.bg};

  max-width: 100%;
  position: relative;
  border-radius: var(--diff-card-radius);
  background-color: ${({$annotationColor}) => $annotationColor.backgroundColor};
  color: ${({$annotationColor}) => $annotationColor.color};

  &:not(del) {
    text-decoration: none;
  }

  &[data-hover] {
    &::after {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
    }

    &:hover {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;

      &::after {
        bottom: -3px;
        border-top: 1px solid var(---diff-card-bg-color);
        border-bottom: 2px solid currentColor;
        border-bottom-left-radius: var(--diff-card-radius);
        border-bottom-right-radius: var(--diff-card-radius);
      }
    }

    [data-from-to-layout]:hover & {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;

      &::after {
        bottom: -3px;
        border-top: 1px solid var(---diff-card-bg-color);
        border-bottom: 2px solid currentColor;
        border-bottom-left-radius: var(--diff-card-radius);
        border-bottom-right-radius: var(--diff-card-radius);
      }
    }
  }
`

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

  const element = (
    <StyledCard
      {...restProps}
      as={as}
      className={className}
      data-hover={disableHoverEffect || !annotation ? undefined : ''}
      data-ui="diff-card"
      ref={ref}
      radius={1}
      // Added annotation color to the card using css to make it possible to override by the ReleaseReview
      $annotationColor={{backgroundColor: color.background, color: color.text}}
      style={style}
    >
      {children}
    </StyledCard>
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
