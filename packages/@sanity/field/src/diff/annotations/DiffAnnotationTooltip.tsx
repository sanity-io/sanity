import React from 'react'
import {Tooltip} from 'react-tippy'
import {DiffAnnotationTooltipContent} from './DiffAnnotationTooltipContent'
import {AnnotationProps, AnnotatedDiffProps} from './DiffAnnotation'
import {getAnnotationForPath} from './helpers'

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
    'diff' in props ? getAnnotationForPath(props.diff, props.path || []) : props.annotation

  if (!annotation) {
    return React.createElement(as, {className, style}, children)
  }

  // Tippy is missing `tag` in property list
  const TippyTooltip = Tooltip as any

  return (
    <TippyTooltip
      tag={as}
      className={className}
      style={style}
      useContext
      arrow
      html={<DiffAnnotationTooltipContent annotation={annotation} />}
      position="top"
      theme="light"
    >
      {children}
    </TippyTooltip>
  )
}
