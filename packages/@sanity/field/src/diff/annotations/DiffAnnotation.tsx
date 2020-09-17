import {useUserColorManager} from '@sanity/base/user-color'
import * as React from 'react'
import {Annotation, Diff, Path} from '../../types'
import {DiffAnnotationTooltip} from './DiffAnnotationTooltip'
import {getAnnotationAtPath, getAnnotationColor} from './helpers'

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
  const userColorManager = useUserColorManager()

  if ('diff' in props) {
    const {as = 'span', children, description, diff, path = [], ...restProps} = props
    const annotation = getAnnotationAtPath(diff, path)
    const color = getAnnotationColor(userColorManager, annotation)

    return (
      <DiffAnnotationTooltip
        {...restProps}
        as={as}
        annotation={annotation}
        description={description}
        style={{background: color.background, color: color.text}}
      >
        {children}
      </DiffAnnotationTooltip>
    )
  }

  const {as = 'span', children, ...restProps} = props
  const color = getAnnotationColor(userColorManager, restProps.annotation)

  return (
    <DiffAnnotationTooltip
      {...restProps}
      as={as}
      style={{background: color.background, color: color.text}}
    >
      {children}
    </DiffAnnotationTooltip>
  )
}
