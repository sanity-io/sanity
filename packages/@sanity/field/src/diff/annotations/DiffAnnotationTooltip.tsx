import {Tooltip} from 'part:@sanity/components/tooltip'
import React, {createElement} from 'react'
import {DiffAnnotationTooltipContent} from './DiffAnnotationTooltipContent'
import {AnnotationProps, AnnotatedDiffProps} from './DiffAnnotation'
import {getAnnotationAtPath} from './helpers'

interface BaseAnnotationProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  description?: React.ReactNode | string
}

export type DiffAnnotationTooltipProps = (AnnotationProps | AnnotatedDiffProps) &
  BaseAnnotationProps

export function DiffAnnotationTooltip(
  props: DiffAnnotationTooltipProps & React.HTMLProps<HTMLElement>
): React.ReactElement {
  const {as = 'div', children, description, ...restProps} = props
  const annotation =
    'diff' in props ? getAnnotationAtPath(props.diff, props.path || []) : props.annotation

  if (!annotation) {
    return createElement(as, restProps, children)
  }

  const content = (
    <DiffAnnotationTooltipContent description={description} annotations={[annotation]} />
  )

  return (
    <Tooltip content={content} placement="top" portal>
      {createElement(as, restProps, children)}
    </Tooltip>
  )
}
