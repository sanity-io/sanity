import {Tooltip} from 'part:@sanity/components/tooltip'
import React, {createElement} from 'react'
import {DiffAnnotationTooltipContent} from './DiffAnnotationTooltipContent'
import {AnnotationProps, AnnotatedDiffProps} from './DiffAnnotation'
import {getAnnotationAtPath} from './helpers'

interface BaseAnnotationProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  style?: React.CSSProperties
  className?: string
  description?: React.ReactNode | string
  children: React.ReactNode
}

export type DiffAnnotationTooltipProps = (AnnotationProps | AnnotatedDiffProps) &
  BaseAnnotationProps

export function DiffAnnotationTooltip(props: DiffAnnotationTooltipProps) {
  const {className, as = 'div', children, description, style} = props
  const annotation =
    'diff' in props ? getAnnotationAtPath(props.diff, props.path || []) : props.annotation

  if (!annotation) {
    return createElement(as, {className, style}, children)
  }

  const content = (
    <DiffAnnotationTooltipContent description={description} annotations={[annotation]} />
  )

  return (
    <Tooltip content={content} position="top">
      {createElement(as, {className, style}, children)}
    </Tooltip>
  )
}
