import * as React from 'react'
import {Annotation, Diff, Path} from '../../types'
import {DiffAnnotationTooltip} from './DiffAnnotationTooltip'
import {getAnnotationAtPath} from './helpers'

export interface AnnotationProps {
  annotation: Annotation | undefined | null
}

export interface AnnotatedDiffProps {
  diff: Diff
  path?: Path | string
}

interface BaseAnnotationProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  description?: React.ReactNode | string
}

export type DiffAnnotationProps = (AnnotationProps | AnnotatedDiffProps) & BaseAnnotationProps

export function DiffAnnotation(props: DiffAnnotationProps & React.HTMLProps<HTMLElement>) {
  if ('diff' in props) {
    const {as = 'span', children, description, diff, path, ...restProps} = props
    const annotation = getAnnotationAtPath(diff, path || [])

    return (
      <DiffAnnotationTooltip
        {...restProps}
        as={as}
        annotation={annotation}
        description={description}
      >
        {children}
      </DiffAnnotationTooltip>
    )
  }

  const {children, ...restProps} = props

  return <DiffAnnotationTooltip {...restProps}>{children}</DiffAnnotationTooltip>
}
