import {useUserColorManager} from '@sanity/base/user-color'
import {Path} from '@sanity/types'
import classNames from 'classnames'
import React, {createElement, forwardRef} from 'react'
import {Annotation, Diff, getAnnotationAtPath, getAnnotationColor} from '../../diff'
import {DiffTooltip} from './DiffTooltip'

import styles from './DiffCard.css'

interface DiffCardProps {
  annotation?: Annotation
  as?: React.ElementType | keyof JSX.IntrinsicElements
  diff?: Diff
  disableHoverEffect?: boolean
  path?: Path | string
  tooltip?: {description?: React.ReactNode} | boolean
}

interface DiffCardWithAnnotationProps {
  annotation?: Annotation
  as?: React.ElementType | keyof JSX.IntrinsicElements
  disableHoverEffect?: boolean
  tooltip?: {description?: React.ReactNode} | boolean
}

export const DiffCard = forwardRef((props: DiffCardProps & React.HTMLProps<HTMLElement>, ref) => {
  if (props.diff) {
    const {diff, path, ...restProps} = props
    const annotation = getAnnotationAtPath(diff, path || [])

    return <DiffCardWithAnnotation {...restProps} annotation={annotation} ref={ref} />
  }

  return <DiffCardWithAnnotation {...props} ref={ref} />
})

DiffCard.displayName = 'DiffCard'

const DiffCardWithAnnotation = forwardRef(
  (props: DiffCardWithAnnotationProps & React.HTMLProps<HTMLElement>, ref) => {
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
      ref,
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
)

DiffCardWithAnnotation.displayName = 'DiffCardWithAnnotation'
