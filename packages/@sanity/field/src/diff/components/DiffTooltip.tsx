import {Tooltip} from 'part:@sanity/components/tooltip'
import React, {createElement} from 'react'
import {getAnnotationAtPath} from '../annotations'
import {DiffAnnotationTooltipContent} from './DiffAnnotationTooltipContent'
import {AnnotationProps, AnnotatedDiffProps} from './DiffCard'

interface BaseAnnotationProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  description?: React.ReactNode | string
}

export type DiffTooltipProps = (AnnotationProps | AnnotatedDiffProps) & BaseAnnotationProps

export function DiffTooltip(
  props: DiffTooltipProps & React.HTMLProps<HTMLElement>
): React.ReactElement {
  if ('diff' in props) {
    const {as = 'div', children, description, diff, path, ...restProps} = props
    const annotation = getAnnotationAtPath(diff, path || [])

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

  const {as = 'div', annotation, children, description, ...restProps} = props

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
