import {Path} from '@sanity/types'
import React, {createElement} from 'react'
import {Diff, Annotation} from '../../types'
import {getAnnotationAtPath, useAnnotationColor} from '../annotations'
import {AnnotationProps, AnnotatedDiffProps} from './DiffCard'

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
  const colorStyle = color ? {backgroundColor: color.background, color: color.text} : {}

  return createElement(as, {...restProps, style: {...colorStyle, ...style}}, children)
}
