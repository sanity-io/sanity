import {Tooltip} from 'part:@sanity/components/tooltip'
import React, {createElement} from 'react'
import {DiffAnnotationTooltipContent} from './DiffAnnotationTooltipContent'
import {AnnotationProps, AnnotatedDiffProps} from './DiffAnnotation'
import {getAnnotationAtPath} from './helpers'

interface BaseAnnotationProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  style?: React.CSSProperties
  className?: string
  children: React.ReactNode
}

export type DiffAnnotationTooltipProps = (AnnotationProps | AnnotatedDiffProps) &
  BaseAnnotationProps

export function DiffAnnotationTooltip(props: DiffAnnotationTooltipProps) {
  const {className, as = 'div', children, style} = props
  const annotation =
    'diff' in props ? getAnnotationAtPath(props.diff, props.path || []) : props.annotation

  if (!annotation) {
    return createElement(as, {className, style}, children)
  }

  return (
    <Tooltip content={<DiffAnnotationTooltipContent annotation={annotation} />} position="top">
      {createElement(as, {className, style}, children)}
    </Tooltip>
  )
}
