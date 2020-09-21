import {useUserColorManager} from '@sanity/base/user-color'
import {Path} from '@sanity/types'
import classNames from 'classnames'
import React, {createElement} from 'react'
import {Annotation, Diff, getAnnotationAtPath, getAnnotationColor} from '../../diff'
import {DiffTooltip} from './DiffTooltip'

import styles from './DiffCard.css'

interface DiffCardProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  diff: Diff
  path?: Path | string
  tooltip?: {description?: React.ReactNode} | boolean
}

interface DiffCardWithAnnotationProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  annotation?: Annotation
  disableHoverEffect?: boolean
  tooltip?: {description?: React.ReactNode} | boolean
}

export function DiffCard(
  props: (DiffCardProps | DiffCardWithAnnotationProps) & React.HTMLProps<HTMLElement>
) {
  if ('diff' in props) {
    const {diff, path, ...restProps} = props
    const annotation = getAnnotationAtPath(diff, path || [])

    return <DiffCardWithAnnotation {...restProps} annotation={annotation} />
  }

  return <DiffCardWithAnnotation {...props} />
}

function DiffCardWithAnnotation(props: DiffCardWithAnnotationProps & React.HTMLProps<HTMLElement>) {
  const {
    annotation,
    as = 'div',
    children,
    className,
    disableHoverEffect,
    style = {},
    tooltip,
    ...restProps
  } = props
  const userColorManager = useUserColorManager()
  const color = getAnnotationColor(userColorManager, annotation)

  const elementProps = {
    ...restProps,
    className: classNames(styles.root, className),
    'data-hover': disableHoverEffect ? undefined : '',
    style: {backgroundColor: color.background, color: color.text, ...style}
  }

  const element = createElement(as, elementProps, children)

  if (tooltip && annotation) {
    return (
      <DiffTooltip
        annotations={[annotation]}
        description={tooltip && typeof tooltip === 'object' && tooltip.description}
      >
        {element}
      </DiffTooltip>
    )
  }

  return element
}
