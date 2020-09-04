import React, {createElement} from 'react'
import {useAnnotationColor} from './hooks'
import {AnnotationProps, AnnotatedDiffProps} from './DiffAnnotation'
import {getAnnotationAtPath} from './helpers'
import {Diff, Annotation} from '../../types'
import {Path} from '../../paths'

interface BaseDiffAnnotationCardProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  diff?: Diff
  path?: Path | string
  annotation?: Annotation
}

export type DiffAnnotationCardProps = (AnnotationProps | AnnotatedDiffProps) &
  BaseDiffAnnotationCardProps

export function DiffAnnotationCard(
  props: DiffAnnotationCardProps & React.HTMLProps<HTMLDivElement>
): React.ReactElement {
  const {
    as = 'div',
    children,
    path,
    diff,
    annotation: specifiedAnnotation,
    style = {},
    ...restProps
  } = props

  const annotation = diff ? getAnnotationAtPath(diff, path || []) : specifiedAnnotation
  const color = useAnnotationColor(annotation)
  const colorStyle = color ? {background: color.background, color: color.text} : {}
  return createElement(as, {...restProps, style: {...colorStyle, ...style}}, children)
}
