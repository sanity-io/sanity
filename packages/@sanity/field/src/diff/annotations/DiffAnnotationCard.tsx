import React, {createElement} from 'react'
import {Diff, Path} from '../types'
import {useDiffAnnotationColor} from './hooks'

interface DiffAnnotationCardProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  diff: Diff
  path?: Path | string
}

export function DiffAnnotationCard(
  props: DiffAnnotationCardProps & React.HTMLProps<HTMLDivElement>
): React.ReactElement {
  const {as = 'div', children, diff, path, style = {}, ...restProps} = props
  const color = useDiffAnnotationColor(diff, path)
  const colorStyle = color ? {background: color.background, color: color.text} : {}
  return createElement(as, {...restProps, style: {...colorStyle, ...style}}, children)
}
