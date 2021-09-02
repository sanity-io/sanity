import {Path} from '@sanity/types'
import React, {forwardRef} from 'react'
import {Box, rem} from '@sanity/ui'
import styled from 'styled-components'
import {Annotation, Diff, getAnnotationAtPath} from '../../diff'
import {useAnnotationColor} from '../annotations'
import {DiffTooltip} from './DiffTooltip'

interface DiffCardProps {
  annotation?: Annotation
  as?: React.ElementType | keyof JSX.IntrinsicElements
  diff?: Diff
  disableHoverEffect?: boolean
  path?: Path | string
  tooltip?: {description?: React.ReactNode} | boolean
}

interface DiffCardWithAnnotationProps {
  annotation?: Annotation
  as?: React.ElementType | keyof JSX.IntrinsicElements
  disableHoverEffect?: boolean
  tooltip?: {description?: React.ReactNode} | boolean
}

const StyledCard = styled(Box)`
  --diff-card-radius: ${({theme}) => rem(theme.sanity.radius[2])};

  background-color: var(--card-bg-color);
  color: var(--card-fg-color);
  max-width: 100%;
  position: relative;
  border-radius: var(--diff-card-radius);

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
        border-top: 1px solid var(---card-bg-color);
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
        border-top: 1px solid var(---card-bg-color);
        border-bottom: 2px solid currentColor;
        border-bottom-left-radius: var(--diff-card-radius);
        border-bottom-right-radius: var(--diff-card-radius);
      }
    }
  }
`

export const DiffCard = forwardRef((props: DiffCardProps & React.HTMLProps<HTMLElement>, ref) => {
  if (!props.diff) {
    return <DiffCardWithAnnotation {...props} ref={ref} />
  }

  const {diff, path = [], ...restProps} = props
  const annotation = getAnnotationAtPath(diff, path)

  return <DiffCardWithAnnotation {...restProps} annotation={annotation} ref={ref} />
})

DiffCard.displayName = 'DiffCard'

const DiffCardWithAnnotation = forwardRef(
  (props: DiffCardWithAnnotationProps & Omit<React.HTMLProps<HTMLElement>, 'height'>, ref) => {
    const {
      annotation,
      as = 'div',
      children,
      className,
      disableHoverEffect,
      style = {},
      tooltip,
      ...restProps
    } = props

    const color = useAnnotationColor(annotation)

    const elementProps = {
      ...restProps,
      className,
      'data-hover': disableHoverEffect || !annotation ? undefined : '',
      ref,
      as,
    }

    const element = (
      <StyledCard
        radius={1}
        style={{
          ...style,
          '--card-bg-color': color.background,
          '--card-fg-color': color.text,
        }}
        {...elementProps}
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
  }
)

DiffCardWithAnnotation.displayName = 'DiffCardWithAnnotation'
