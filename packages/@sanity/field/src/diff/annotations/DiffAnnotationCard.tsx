import React, {createElement} from 'react'
import {useAnnotationColor} from './hooks'
import {AnnotationProps, AnnotatedDiffProps} from './DiffAnnotation'
import {getAnnotationAtPath} from './helpers'

interface BaseDiffAnnotationCardProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
}

export type DiffAnnotationCardProps = (AnnotationProps | AnnotatedDiffProps) &
  BaseDiffAnnotationCardProps

export function DiffAnnotationCard(
  props: DiffAnnotationCardProps & React.HTMLProps<HTMLDivElement>
): React.ReactElement {
  const {as = 'div', children, style = {}, ...restProps} = props
  const annotation =
    'diff' in props ? getAnnotationAtPath(props.diff, props.path || []) : props.annotation

  const color = useAnnotationColor(annotation)
  const colorStyle = color ? {background: color.background, color: color.text} : {}
  return createElement(as, {...restProps, style: {...colorStyle, ...style}}, children)
}
