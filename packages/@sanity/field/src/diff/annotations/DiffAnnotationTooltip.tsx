import React from 'react'
import {Tooltip} from 'react-tippy'
import {Annotation} from '../types'
import {DiffAnnotationTooltipContent} from './DiffAnnotationTooltipContent'

export interface AnnotationTooltipProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  style?: React.CSSProperties
  className?: string
  annotation: Annotation
  children: React.ReactNode
}

export function DiffAnnotationTooltip({
  annotation,
  className,
  as = 'div',
  children,
  style
}: AnnotationTooltipProps) {
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
