import React from 'react'
import {Tooltip} from 'react-tippy'
import {Annotation} from '../types'
import {DiffAnnotationTooltipContent} from './DiffAnnotationTooltipContent'

export interface AnnotationTooltipProps {
  annotation: Annotation
  children: React.ReactNode
}

export function DiffAnnotationTooltip(props: AnnotationTooltipProps) {
  if (!props.annotation) {
    return <>{props.children}</>
  }

  return (
    <Tooltip
      useContext
      arrow
      html={<DiffAnnotationTooltipContent annotation={props.annotation} />}
      position="top"
      theme="light"
    >
      {props.children}
    </Tooltip>
  )
}
